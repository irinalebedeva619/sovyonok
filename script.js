(function() {
    "use strict";

    // ========== СОСТОЯНИЕ ==========
    let posts = [];
    let chatMessages = [];
    let currentImageData = null;
    let isDeveloper = false;
    let currentDiscussPost = null;
    let replyToComment = null;
    let editingPost = null;
    let visitorCount = 0;
    const DEV_PASSWORD = 'sovyonok2024';

    // ========== DOM ЭЛЕМЕНТЫ ==========
    const feedContainer = document.getElementById('feedContainer');
    const bookmarksContainer = document.getElementById('bookmarksContainer');
    const postInput = document.getElementById('postInput');
    const publishBtn = document.getElementById('publishBtn');
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const bookmarkCount = document.getElementById('bookmarkCount');
    const chatCount = document.getElementById('chatCount');
    const chatMessagesEl = document.getElementById('chatMessages');
    const chatNameInput = document.getElementById('chatNameInput');
    const chatMessageInput = document.getElementById('chatMessageInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const devLoginBtn = document.getElementById('devLoginBtn');
    const devModal = document.getElementById('devModal');
    const devModalClose = document.getElementById('devModalClose');
    const devPassword = document.getElementById('devPassword');
    const devLoginSubmit = document.getElementById('devLoginSubmit');
    const devError = document.getElementById('devError');
    const chatPostRef = document.getElementById('chatPostRef');
    const chatPostText = document.getElementById('chatPostText');
    const clearChatRef = document.getElementById('clearChatRef');
    const visitorCountEl = document.getElementById('visitorCount');

    // ========== СЧЁТЧИК ПОСЕЩАЕМОСТИ ==========
    function initVisitorCounter() {
        const today = new Date().toDateString();
        const lastVisit = localStorage.getItem('sovyonok_last_visit');
        const savedCount = localStorage.getItem('sovyonok_visitor_count');
        
        if (savedCount) {
            visitorCount = parseInt(savedCount);
        } else {
            visitorCount = 2350;
        }
        
        if (lastVisit !== today) {
            visitorCount += 1;
            localStorage.setItem('sovyonok_last_visit', today);
            localStorage.setItem('sovyonok_visitor_count', visitorCount.toString());
        }
        
        updateVisitorCounter();
    }

    function updateVisitorCounter() {
        if (visitorCountEl) {
            visitorCountEl.textContent = visitorCount.toLocaleString('ru-RU');
        }
    }

    // ========== МОДАЛЬНОЕ ОКНО ==========
    function openModal() {
        devModal.classList.add('active');
        devPassword.value = '';
        devError.style.display = 'none';
        devPassword.focus();
    }

    function closeModal() {
        devModal.classList.remove('active');
    }

    devLoginBtn.addEventListener('click', openModal);
    devModalClose.addEventListener('click', closeModal);
    devModal.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    // ========== ВХОД РАЗРАБОТЧИКА ==========
    devLoginSubmit.addEventListener('click', function() {
        const pass = devPassword.value;
        if (pass === DEV_PASSWORD) {
            isDeveloper = true;
            localStorage.setItem('sovyonok_dev', 'true');
            closeModal();
            updateDeveloperUI();
            alert('🦉 Добро пожаловать, разработчик!');
            renderAll();
        } else {
            devError.style.display = 'block';
            devPassword.value = '';
            devPassword.focus();
        }
    });

    devPassword.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            devLoginSubmit.click();
        }
    });

    // ========== ВЫХОД ИЗ РЕЖИМА РАЗРАБОТЧИКА ==========
    function logoutDeveloper() {
        if (confirm('Выйти из режима разработчика?')) {
            isDeveloper = false;
            localStorage.setItem('sovyonok_dev', 'false');
            updateDeveloperUI();
            alert('👋 Вы вышли из режима разработчика');
            renderAll();
        }
    }

    // ========== ПРОВЕРКА РАЗРАБОТЧИКА ==========
    function checkDeveloper() {
        const devFlag = localStorage.getItem('sovyonok_dev');
        isDeveloper = devFlag === 'true';
        updateDeveloperUI();
    }

    function updateDeveloperUI() {
        const createArea = document.getElementById('createPostArea');
        if (createArea) {
            createArea.style.display = isDeveloper ? 'block' : 'none';
        }
        
        if (devLoginBtn) {
            if (isDeveloper) {
                devLoginBtn.innerHTML = '<i class="fas fa-user-cog"></i> Разработчик';
                devLoginBtn.className = 'nav-btn dev-btn active-dev';
                devLoginBtn.onclick = function(e) {
                    e.stopPropagation();
                    logoutDeveloper();
                };
            } else {
                devLoginBtn.innerHTML = '<i class="fas fa-user-cog"></i> Войти';
                devLoginBtn.className = 'nav-btn dev-btn';
                devLoginBtn.onclick = function(e) {
                    e.stopPropagation();
                    openModal();
                };
            }
        }
    }

    // ========== ЗАГРУЗКА/СОХРАНЕНИЕ ==========
    function loadFromStorage() {
        try {
            const savedPosts = localStorage.getItem('sovyonok_posts');
            if (savedPosts) {
                posts = JSON.parse(savedPosts);
                return true;
            }
            return false;
        } catch (e) {
            console.warn('Ошибка загрузки данных', e);
            return false;
        }
    }

    function saveToStorage() {
        try {
            localStorage.setItem('sovyonok_posts', JSON.stringify(posts));
            localStorage.setItem('sovyonok_chat', JSON.stringify(chatMessages));
        } catch (e) {
            console.warn('Ошибка сохранения', e);
        }
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function generateId() {
        return Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    }

    function escapeHTML(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Новая функция для преобразования текста с переносами в HTML
    function formatTextWithBreaks(text) {
        if (!text) return '';
        // Экранируем HTML, но сохраняем переносы строк
        const escaped = escapeHTML(text);
        // Заменяем \n на <br>
        return escaped.replace(/\n/g, '<br>');
    }

    function getBookmarkCount() {
        return posts.filter(p => p.bookmarked).length;
    }

    function getChatCount() {
        return chatMessages.length;
    }

    function updateCounters() {
        if (bookmarkCount) bookmarkCount.textContent = getBookmarkCount();
        if (chatCount) chatCount.textContent = getChatCount();
        updateVisitorCounter();
    }

    // ========== ФУНКЦИЯ ДЛЯ ОБСУЖДЕНИЯ В ЧАТЕ ==========
    function discussInChat(postId) {
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        
        currentDiscussPost = postId;
        const shortText = post.text.length > 50 ? post.text.substring(0, 50) + '...' : post.text;
        chatPostText.textContent = '"' + shortText + '"';
        chatPostRef.style.display = 'block';
        
        switchPage('chat');
        
        setTimeout(() => {
            chatMessageInput.focus();
        }, 300);
    }

    if (clearChatRef) {
        clearChatRef.addEventListener('click', function() {
            chatPostRef.style.display = 'none';
            currentDiscussPost = null;
        });
    }

    // ========== ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ ==========
    function switchPage(pageId) {
        // Отменяем редактирование при переключении страницы
        if (editingPost) {
            cancelEdit();
        }
        
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const page = document.getElementById(pageId + 'Page');
        if (page) page.classList.add('active');
        
        document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === pageId);
        });
        
        if (pageId === 'feed') renderFeed(feedContainer, true);
        if (pageId === 'bookmarks') renderFeed(bookmarksContainer, false);
        if (pageId === 'chat') renderChat();
    }

    // ========== НАЧАЛО РЕДАКТИРОВАНИЯ ПОСТА ==========
    function startEditPost(postId) {
        if (!isDeveloper) {
            alert('Только разработчик может редактировать посты!');
            return;
        }
        
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        
        // Отменяем предыдущее редактирование
        if (editingPost) {
            cancelEdit();
        }
        
        editingPost = {
            postId: post.id,
            text: post.text,
            imageData: post.imageData
        };
        
        postInput.value = post.text;
        
        if (post.imageData) {
            currentImageData = post.imageData;
            previewImg.src = post.imageData;
            imagePreview.style.display = 'block';
        } else {
            currentImageData = null;
            imagePreview.style.display = 'none';
            previewImg.src = '#';
        }
        
        publishBtn.innerHTML = '💾 Сохранить изменения';
        publishBtn.style.background = 'linear-gradient(135deg, #f5b342, #e8926a)';
        
        // Переключаемся на страницу ленты, если мы не там
        const feedPage = document.getElementById('feedPage');
        if (!feedPage.classList.contains('active')) {
            switchPage('feed');
        }
        
        document.getElementById('createPostArea').scrollIntoView({ behavior: 'smooth', block: 'center' });
        postInput.focus();
    }

    // ========== ОТМЕНА РЕДАКТИРОВАНИЯ ==========
    function cancelEdit() {
        if (editingPost) {
            editingPost = null;
            currentImageData = null;
            imagePreview.style.display = 'none';
            previewImg.src = '#';
            postInput.value = '';
            publishBtn.innerHTML = 'Опубликовать';
            publishBtn.style.background = '';
        }
    }

    // ========== УДАЛЕНИЕ ПОСТА ==========
    function deletePost(postId) {
        if (!isDeveloper) {
            alert('Только разработчик может удалять посты!');
            return false;
        }
        
        if (confirm('Вы уверены, что хотите удалить этот пост?')) {
            posts = posts.filter(p => p.id !== postId);
            saveToStorage();
            renderAll();
            alert('Пост удалён!');
            return true;
        }
        return false;
    }

    // ========== УДАЛЕНИЕ СООБЩЕНИЯ В ЧАТЕ ==========
    function deleteChatMessage(msgId) {
        if (!isDeveloper) {
            alert('Только разработчик может удалять сообщения!');
            return false;
        }
        
        if (confirm('Удалить это сообщение?')) {
            chatMessages = chatMessages.filter(m => m.id !== msgId);
            saveToStorage();
            renderChat();
            return true;
        }
        return false;
    }

    // ========== РЕНДЕРИНГ КОММЕНТАРИЕВ ==========
    function renderComments(comments, postId, isReply = false) {
        if (!comments || comments.length === 0) return '';
        
        let html = '';
        for (const comment of comments) {
            const repliesHtml = comment.replies && comment.replies.length > 0 
                ? `<div class="replies">${renderComments(comment.replies, postId, true)}</div>` 
                : '';
            
            const replyBtn = !isReply ? `
                <button class="reply-btn" data-reply-to="${postId}|${comment.id}|${escapeHTML(comment.author)}">
                    <i class="fas fa-reply"></i> Ответить
                </button>
            ` : '';

            const deleteBtn = isDeveloper ? `
                <span class="comment-delete" data-del-comment="${postId}|${comment.id}">
                    <i class="fas fa-times"></i>
                </span>
            ` : '';

            html += `
                <div class="comment-item" data-comment-id="${comment.id}">
                    <div class="comment-header">
                        <span class="comment-author">${escapeHTML(comment.author)}</span>
                        ${deleteBtn}
                    </div>
                    <div class="comment-text">${formatTextWithBreaks(comment.text)}</div>
                    <div class="comment-actions">
                        ${replyBtn}
                    </div>
                    ${repliesHtml}
                </div>
            `;
        }
        return html;
    }

    // ========== РЕНДЕРИНГ ЛЕНТЫ ==========
    function renderFeed(container = feedContainer, showAll = true) {
        let filteredPosts = showAll ? posts : posts.filter(p => p.bookmarked);
        
        if (!filteredPosts.length) {
            const message = showAll ? 'Новостей пока нет' : 'У вас пока нет сохранённых постов';
            container.innerHTML = `
                <div class="empty-feed">
                    <i class="far ${showAll ? 'fa-newspaper' : 'fa-bookmark'}"></i>
                    <p>${message}</p>
                    ${showAll ? '<p style="font-size:0.85rem; opacity:0.6;">Добро пожаловать в клуб "Совёнок"!</p>' : ''}
                </div>
            `;
            return;
        }

        let html = '';
        for (let i = 0; i < filteredPosts.length; i++) {
            const post = filteredPosts[i];
            const comments = post.comments || [];
            const likes = post.likes || 0;
            const liked = post.likedByUser || false;
            const bookmarked = post.bookmarked || false;

            let imageHtml = '';
            if (post.imageData) {
                imageHtml = `
                    <div class="post-image">
                        <img src="${escapeHTML(post.imageData)}" alt="Изображение к посту" loading="lazy" />
                    </div>
                `;
            }

            const deleteBtn = isDeveloper ? `
                <button class="delete-post-btn" data-delete-post="${post.id}" title="Удалить пост">
                    <i class="fas fa-trash-alt"></i>
                </button>
            ` : '';

            const editBtn = isDeveloper ? `
                <button class="edit-post-btn" data-edit-post="${post.id}" title="Редактировать пост">
                    <i class="fas fa-pen"></i>
                </button>
            ` : '';

            let replyIndicator = '';
            if (replyToComment && replyToComment.postId === post.id) {
                replyIndicator = `
                    <div style="background:#fef5ea; padding:6px 12px; border-radius:12px; margin-bottom:6px; font-size:0.8rem; color:#5a2d0c; border:2px dashed #f5a97f;">
                        <i class="fas fa-reply"></i> Ответ для <strong>${escapeHTML(replyToComment.author)}</strong>
                        <button id="cancelReply" style="background:none; border:none; color:#ff6b6b; cursor:pointer; margin-left:8px;">✕</button>
                    </div>
                `;
            }

            html += `
                <div class="post-card" data-post-id="${post.id}">
                    <div class="post-header">
                        <div class="post-author">
                            <i class="fas fa-feather-alt"></i> Совёнок
                        </div>
                        <div class="post-header-actions">
                            ${editBtn}
                            ${deleteBtn}
                        </div>
                    </div>
                    <div class="post-content">${formatTextWithBreaks(post.text)}</div>
                    ${imageHtml}
                    
                    <div class="post-actions">
                        <button class="action-btn ${liked ? 'liked' : ''}" data-like="${post.id}">
                            <i class="${liked ? 'fas' : 'far'} fa-heart"></i>
                            <span>${likes}</span>
                        </button>
                        
                        <button class="action-btn ${bookmarked ? 'bookmarked' : ''}" data-bookmark="${post.id}">
                            <i class="${bookmarked ? 'fas' : 'far'} fa-bookmark"></i>
                            <span>${bookmarked ? 'В закладках' : 'Закладка'}</span>
                        </button>
                        
                        <button class="action-btn" data-comment-toggle="${post.id}">
                            <i class="far fa-comment"></i>
                            <span>${comments.length}</span>
                        </button>
                        
                        <button class="discuss-btn" data-discuss="${post.id}">
                            <i class="fas fa-comments"></i> Обсудить в чате
                        </button>
                    </div>

                    <div class="comment-section">
                        ${replyIndicator}
                        <div class="comment-input-wrap">
                            <input type="text" placeholder="${replyToComment && replyToComment.postId === post.id ? 'Ответ для ' + escapeHTML(replyToComment.author) + '...' : 'Написать комментарий...'}" data-comment-input="${post.id}" />
                            <button data-comment-add="${post.id}"><i class="fas fa-arrow-right"></i></button>
                        </div>
                        <div class="comment-list" id="commentList-${post.id}">
                            ${renderComments(comments, post.id)}
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
        
        const cancelBtn = document.getElementById('cancelReply');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                replyToComment = null;
                renderAll();
            });
        }
        
        document.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const data = this.dataset.replyTo.split('|');
                replyToComment = {
                    postId: data[0],
                    commentId: data[1],
                    author: data[2]
                };
                renderAll();
                const input = document.querySelector(`input[data-comment-input="${replyToComment.postId}"]`);
                if (input) {
                    input.focus();
                    input.placeholder = `Ответ для ${replyToComment.author}...`;
                }
            });
        });

        document.querySelectorAll('.edit-post-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                startEditPost(this.dataset.editPost);
            });
        });
        
        updateCounters();
        saveToStorage();
    }

    // ========== РЕНДЕРИНГ ВСЕГО ==========
    function renderAll() {
        renderFeed(feedContainer, true);
        renderFeed(bookmarksContainer, false);
        renderChat();
        updateCounters();
    }

    // ========== РЕНДЕРИНГ ЧАТА ==========
    function renderChat() {
        if (!chatMessages.length) {
            chatMessagesEl.innerHTML = `
                <div class="chat-empty">
                    <i class="fas fa-comment-dots" style="font-size:1.8rem; opacity:0.3;"></i>
                    <p>Вопросов пока нет</p>
                    <p style="font-size:0.8rem; opacity:0.6;">Задайте первый вопрос о книгах или чтении!</p>
                </div>
            `;
            return;
        }

        let html = '';
        for (let i = chatMessages.length - 1; i >= 0; i--) {
            const msg = chatMessages[i];
            
            let nameDisplay;
            if (msg.isSovyonok) {
                nameDisplay = '<span class="sovyonok">🦉 Совёнок</span>';
            } else if (msg.name) {
                nameDisplay = escapeHTML(msg.name);
            } else {
                nameDisplay = '<span class="anonymous">Аноним</span>';
            }
            
            const deleteBtn = isDeveloper ? `
                <button class="msg-delete" data-delete-chat="${msg.id}">
                    <i class="fas fa-times"></i>
                </button>
            ` : '';

            html += `
                <div class="chat-message" data-msg-id="${msg.id}">
                    <div class="msg-name">${nameDisplay}</div>
                    <div class="msg-text">${formatTextWithBreaks(msg.text)}</div>
                    ${deleteBtn}
                </div>
            `;
        }
        
        chatMessagesEl.innerHTML = html;
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        updateCounters();
        saveToStorage();
    }

    // ========== СОХРАНЕНИЕ/ПУБЛИКАЦИЯ ПОСТА ==========
    function savePost(text, imageData) {
        if (!isDeveloper) {
            alert('Только разработчик может публиковать посты!');
            return false;
        }
        
        const trimmed = text.trim();
        if (!trimmed && !imageData) {
            alert('Напишите текст или прикрепите фото!');
            return false;
        }

        if (editingPost) {
            const post = posts.find(p => p.id === editingPost.postId);
            if (post) {
                // Сохраняем текст с переносами строк
                post.text = trimmed || '';
                post.imageData = imageData || null;
                
                // Сбрасываем состояние редактирования
                editingPost = null;
                currentImageData = null;
                imagePreview.style.display = 'none';
                previewImg.src = '#';
                postInput.value = '';
                publishBtn.innerHTML = 'Опубликовать';
                publishBtn.style.background = '';
                
                saveToStorage();
                renderAll();
                alert('✅ Пост обновлён!');
                return true;
            } else {
                // Пост не найден - сбрасываем редактирование
                cancelEdit();
                alert('Ошибка: пост не найден');
                return false;
            }
        }

        const newPost = {
            id: generateId(),
            // Сохраняем текст с переносами строк
            text: trimmed || '',
            likes: 0,
            likedByUser: false,
            bookmarked: false,
            imageData: imageData || null,
            comments: []
        };

        posts.unshift(newPost);
        currentImageData = null;
        imagePreview.style.display = 'none';
        previewImg.src = '#';
        saveToStorage();
        renderAll();
        postInput.value = '';
        postInput.style.height = 'auto';
        alert('✅ Пост опубликован!');
        return true;
    }

    // ========== ДОБАВЛЕНИЕ КОММЕНТАРИЯ ==========
    function addComment(postId, text) {
        const trimmed = text.trim();
        if (!trimmed) {
            alert('Напишите комментарий!');
            return false;
        }
        
        const post = posts.find(p => p.id === postId);
        if (!post) return false;
        
        if (replyToComment && replyToComment.postId === postId) {
            const parentComment = post.comments.find(c => c.id === replyToComment.commentId);
            if (parentComment) {
                if (!parentComment.replies) parentComment.replies = [];
                parentComment.replies.push({
                    id: generateId(),
                    text: trimmed,
                    author: 'Аноним'
                });
                replyToComment = null;
                saveToStorage();
                renderAll();
                return true;
            }
        }
        
        post.comments.push({
            id: generateId(),
            text: trimmed,
            author: 'Аноним',
            replies: []
        });
        saveToStorage();
        renderAll();
        return true;
    }

    // ========== УДАЛЕНИЕ КОММЕНТАРИЯ ==========
    function deleteComment(postId, commentId) {
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        
        let found = false;
        for (const c of post.comments) {
            if (c.id === commentId) {
                post.comments = post.comments.filter(c => c.id !== commentId);
                found = true;
                break;
            }
            if (c.replies) {
                const replyIndex = c.replies.findIndex(r => r.id === commentId);
                if (replyIndex !== -1) {
                    c.replies.splice(replyIndex, 1);
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            post.comments = post.comments.filter(c => c.id !== commentId);
        }
        saveToStorage();
        renderAll();
    }

    // ========== ДОБАВЛЕНИЕ СООБЩЕНИЯ В ЧАТ ==========
    function addChatMessage(name, text) {
        const trimmed = text.trim();
        if (!trimmed) {
            alert('Напишите вопрос!');
            return false;
        }
        
        let messageText = trimmed;
        if (currentDiscussPost) {
            const post = posts.find(p => p.id === currentDiscussPost);
            if (post) {
                const shortText = post.text.length > 40 ? post.text.substring(0, 40) + '...' : post.text;
                messageText = 'Обсуждаем пост: "' + shortText + '"\n\n' + trimmed;
                chatPostRef.style.display = 'none';
                currentDiscussPost = null;
            }
        }
        
        const isSovyonok = isDeveloper;
        const displayName = isDeveloper ? '' : (name ? name.trim() : '');
        
        chatMessages.push({
            id: generateId(),
            name: displayName,
            text: messageText,
            isSovyonok: isSovyonok
        });
        saveToStorage();
        renderChat();
        chatMessageInput.value = '';
        if (!isDeveloper) {
            chatNameInput.value = '';
        }
        return true;
    }

    // ========== ЛАЙК ==========
    function toggleLike(postId) {
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        post.likedByUser = !post.likedByUser;
        post.likes = post.likedByUser ? post.likes + 1 : post.likes - 1;
        if (post.likes < 0) post.likes = 0;
        saveToStorage();
        renderAll();
    }

    // ========== ЗАКЛАДКА ==========
    function toggleBookmark(postId) {
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        post.bookmarked = !post.bookmarked;
        saveToStorage();
        renderAll();
    }

    // ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
    
    document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
        btn.addEventListener('click', function() {
            switchPage(this.dataset.tab);
        });
    });

    if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    currentImageData = e.target.result;
                    previewImg.src = currentImageData;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(this.files[0]);
            }
            this.value = '';
        });
    }

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', function() {
            currentImageData = null;
            imagePreview.style.display = 'none';
            previewImg.src = '#';
        });
    }

    if (publishBtn) {
        publishBtn.addEventListener('click', function() {
            const text = postInput.value;
            savePost(text, currentImageData);
        });
    }

    if (postInput) {
        postInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                publishBtn.click();
            }
            if (e.key === 'Escape' && editingPost) {
                cancelEdit();
                renderAll();
            }
        });
    }

    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', function() {
            const name = chatNameInput.value;
            const text = chatMessageInput.value;
            addChatMessage(name, text);
        });
    }

    if (chatMessageInput) {
        chatMessageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                chatSendBtn.click();
            }
        });
    }

    // ========== ДЕЛЕГИРОВАНИЕ СОБЫТИЙ ==========
    document.addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.dataset.discuss) {
            discussInChat(target.dataset.discuss);
            return;
        }

        if (target.dataset.deletePost) {
            deletePost(target.dataset.deletePost);
            return;
        }

        if (target.dataset.deleteChat) {
            deleteChatMessage(target.dataset.deleteChat);
            return;
        }

        if (target.dataset.like) {
            toggleLike(target.dataset.like);
            return;
        }

        if (target.dataset.bookmark) {
            toggleBookmark(target.dataset.bookmark);
            return;
        }

        if (target.dataset.commentAdd) {
            const postId = target.dataset.commentAdd;
            const input = document.querySelector(`input[data-comment-input="${postId}"]`);
            if (input) {
                addComment(postId, input.value);
                input.value = '';
                if (replyToComment) {
                    replyToComment = null;
                    renderAll();
                }
            }
            return;
        }

        if (target.dataset.commentToggle) {
            const postId = target.dataset.commentToggle;
            const input = document.querySelector(`input[data-comment-input="${postId}"]`);
            if (input) input.focus();
            return;
        }
    });

    document.addEventListener('click', function(e) {
        const deleteIcon = e.target.closest('.comment-delete');
        if (!deleteIcon) return;
        const data = deleteIcon.dataset.delComment;
        if (data) {
            const [postId, commentId] = data.split('|');
            deleteComment(postId, commentId);
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.dataset.commentInput) {
            e.preventDefault();
            const postId = e.target.dataset.commentInput;
            addComment(postId, e.target.value);
            e.target.value = '';
            if (replyToComment) {
                replyToComment = null;
                renderAll();
            }
        }
    });

    // ========== ДЕМО ДАННЫЕ (72 ПОСТА) ==========
    function initDemoData() {
        const texts = [
            '📚 Сегодня читали "Колобка" с малышами — восторг!',
            '🌟 Как привить любовь к чтению с пелёнок? Делитесь опытом!',
            '🦉 В клубе "Совёнок" стартует марафон "Сказка на ночь"!',
            '📖 Какие книги вы читаете с детьми перед сном?',
            '🎨 Творческая встреча: рисуем иллюстрации к любимым сказкам!',
            '📚 Подборка книг для детей 3-4 лет',
            '🌟 Чтение развивает фантазию и речь',
            '🦉 Родительский клуб: обмен опытом',
            '📖 Уютные вечера с книгой — лучший отдых',
            '🎨 Как выбрать книгу по возрасту?',
            '📚 Читаем вместе с детьми — строим будущее',
            '🌟 Сказки народов мира',
            '🦉 Игровые методики обучения чтению',
            '📖 Книги с картинками — первые шаги',
            '🎨 Театр теней по сказкам',
            '📚 Читательский дневник: идеи для заполнения',
            '🌟 Приобщаем к чтению с раннего возраста',
            '🦉 Семейные традиции: чтение по кругу',
            '📖 Как отвечать на вопросы детей о прочитанном',
            '🎨 Рисуем героев сказок',
            '📚 Подборка книг для малышей 1-2 лет',
            '🌟 Как превратить чтение в праздник',
            '🦉 Развитие речи через чтение',
            '📖 Ваша любимая детская книга? Делитесь!',
            '📚 Библиотека в детском саду: наши мероприятия',
            '🎨 Конкурс рисунков по мотивам прочитанных книг',
            '🌟 Сказкотерапия для детей',
            '📖 Чтение с детьми — основа развития',
            '🦉 Вечерние сказки: традиция нашей семьи',
            '📚 Календарь чтения на месяц',
            '🎨 Театрализованные представления по сказкам',
            '🌟 Игры по мотивам любимых книг',
            '📖 Моя первая книга: что выбрать?',
            '🦉 Книжный клуб для самых маленьких',
            '📚 Семейное чтение: что это даёт ребёнку?',
            '🎨 Иллюстрации к стихам Агнии Барто',
            '🌟 Книги о дружбе и добре',
            '📖 Как читать детям, чтобы им было интересно?',
            '🦉 Наша библиотека: книжные новинки',
            '📚 Развиваем эмоциональный интеллект через книги',
            '🎨 Творческие задания по прочитанному',
            '🌟 Стихи и сказки для малышей',
            '📖 Книги о природе для детей',
            '🦉 Как сохранить интерес к чтению на долгие годы?',
            '📚 Читаем вместе: семейный опыт',
            '🎨 Рисуем персонажей сказок',
            '🌟 Воспитание книгой: как это работает?',
            '📖 Какие книги читать детям 5-6 лет?',
            '🦉 Детская поэзия: учим стихи с удовольствием',
            '📚 Как выбрать книгу для ребёнка в магазине?',
            '🎨 Мастер-класс: создаём книгу своими руками',
            '🌟 Сказки в дорогу: что взять в поездку?',
            '📖 Чтение перед сном: традиция на все времена',
            '🦉 Книги о животных для дошкольников',
            '📚 Как обсуждать прочитанное с ребёнком?',
            '🎨 Интерактивные книги: наш опыт',
            '🌟 Читаем вместе в выходной день',
            '📖 Книги для развития речи и мышления',
            '🦉 Наша семейная библиотека: любимые книги',
            '📚 Как заинтересовать ребёнка чтением?',
            '🎨 Рисуем по мотивам любимых сказок',
            '🌟 Добрые книги, которые учат дружить',
            '📖 Что читать детям в 2-3 года?',
            '🦉 Книжные выставки в нашей библиотеке',
            '📚 Читаем вместе: рекомендации психолога',
            '🎨 Лепка героев из пластилина',
            '🌟 Книги о семье и любви для детей',
            '📖 Как превратить чтение в игру?',
            '🦉 Сказки народов мира: наше путешествие',
            '📚 Поэтические вечера в клубе "Совёнок"',
            '🎨 Изготовление поделок по мотивам книг',
            '🌟 Книги для самостоятельного чтения первоклассников'
        ];

        const likesList = [
            42,38,51,45,47,39,53,41,44,36,
            50,43,48,37,46,55,40,52,35,44,
            49,57,39,47,41,45,52,38,49,42,
            50,37,46,43,51,40,48,44,53,36,
            47,42,50,39,45,52,41,49,43,46,
            38,54,40,48,42,51,37,49,44,50,
            41,47,39,53,46,43,52,40,48,45,
            42,51
        ];

        posts = [];
        for (let i = 0; i < 72; i++) {
            posts.push({
                id: 'p' + (i + 1),
                text: texts[i],
                likes: likesList[i],
                likedByUser: false,
                bookmarked: false,
                imageData: null,
                comments: []
            });
        }
        
        chatMessages = [
            { id: 'chat1', name: 'Мария', text: 'А кто-нибудь уже пробовал читать "Волшебника Изумрудного города" с детьми 4 лет?', isSovyonok: false },
            { id: 'chat2', name: 'Анна', text: 'Очень интересная тема! Моя дочка обожает сказки Пушкина', isSovyonok: false },
            { id: 'chat3', name: 'Елена', text: 'А как вы приучаете детей к чтению, если они не хотят сидеть на месте?', isSovyonok: false },
            { id: 'chat4', name: '', text: 'Спасибо за полезную информацию!', isSovyonok: false },
            { id: 'chat5', name: 'Ольга', text: 'Подскажите, какие книги подойдут для развития речи в 3 года?', isSovyonok: false },
            { id: 'chat6', name: 'Светлана', text: 'У нас дома целая библиотека! Дети любят рассматривать картинки', isSovyonok: false },
            { id: 'chat7', name: '', text: 'А где можно найти хорошие аудиосказки для детей?', isSovyonok: false },
            { id: 'chat8', name: 'Татьяна', text: 'Спасибо за ваш клуб! Очень полезная информация', isSovyonok: false }
        ];
        
        saveToStorage();
    }

    // ========== ЗАПУСК ==========
    checkDeveloper();
    initVisitorCounter();
    
    // Проверяем, есть ли данные в localStorage, если нет - загружаем демо
    if (!loadFromStorage()) {
        initDemoData();
    } else {
        // Загружаем чат из localStorage
        try {
            const savedChat = localStorage.getItem('sovyonok_chat');
            if (savedChat) {
                chatMessages = JSON.parse(savedChat);
            } else {
                // Если чата нет, но посты есть - инициализируем чат демо-данными
                chatMessages = [
                    { id: 'chat1', name: 'Мария', text: 'А кто-нибудь уже пробовал читать "Волшебника Изумрудного города" с детьми 4 лет?', isSovyonok: false },
                    { id: 'chat2', name: 'Анна', text: 'Очень интересная тема! Моя дочка обожает сказки Пушкина', isSovyonok: false },
                    { id: 'chat3', name: 'Елена', text: 'А как вы приучаете детей к чтению, если они не хотят сидеть на месте?', isSovyonok: false },
                    { id: 'chat4', name: '', text: 'Спасибо за полезную информацию!', isSovyonok: false },
                    { id: 'chat5', name: 'Ольга', text: 'Подскажите, какие книги подойдут для развития речи в 3 года?', isSovyonok: false },
                    { id: 'chat6', name: 'Светлана', text: 'У нас дома целая библиотека! Дети любят рассматривать картинки', isSovyonok: false },
                    { id: 'chat7', name: '', text: 'А где можно найти хорошие аудиосказки для детей?', isSovyonok: false },
                    { id: 'chat8', name: 'Татьяна', text: 'Спасибо за ваш клуб! Очень полезная информация', isSovyonok: false }
                ];
                saveToStorage();
            }
        } catch (e) {
            console.warn('Ошибка загрузки чата', e);
        }
    }
    
    renderAll();
})();
