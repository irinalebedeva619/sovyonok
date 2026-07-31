(function() {
    "use strict";

    // ========== НАСТРОЙКИ ОБЛАЧНОГО ХРАНИЛИЩА ==========
    const BIN_ID = '6a6c7899f5f4af5e29d98739';
    const API_KEY = '$2a$10$B.mxMWS0cPYt5wsZCbc4xOlHocB1VhEIata67OWReO1VNkSHk7.c6';
    const DEV_PASSWORD = 'sovyonok2024';
    const MAX_IMAGE_SIZE = 150 * 1024;

    // ========== СОСТОЯНИЕ ==========
    let posts = [];
    let chatMessages = [];
    let currentImageData = null;
    let isDeveloper = false;
    let currentDiscussPost = null;
    let replyToComment = null;
    let editingPost = null;
    let visitorCount = 0;
    let isSyncing = false;
    let lastSyncTime = 0;

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

    // ========== РАБОТА С ОБЛАКОМ ==========
    function isCloudConfigured() {
        return API_KEY && API_KEY !== 'ваш_api_key' && BIN_ID && BIN_ID !== 'ваш_bin_id';
    }

    async function loadFromCloud() {
        if (!isCloudConfigured()) {
            console.log('☁️ Облако не настроено');
            return false;
        }

        try {
            console.log('☁️ Загрузка из облака...');
            const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
                headers: { 'X-Master-Key': API_KEY }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.record && data.record.posts && data.record.posts.length > 0) {
                    posts = data.record.posts;
                    chatMessages = data.record.chat || [];
                    console.log('✅ Загружено из облака:', posts.length, 'постов');
                    saveToLocalStorage();
                    return true;
                } else {
                    console.log('☁️ В облаке нет данных');
                    return false;
                }
            } else {
                console.warn('❌ Ошибка загрузки из облака:', response.status);
                return false;
            }
        } catch (e) {
            console.warn('❌ Ошибка соединения с облаком:', e.message);
            return false;
        }
    }

    async function saveToCloud() {
        if (!isCloudConfigured() || isSyncing) return false;
        if (Date.now() - lastSyncTime < 3000) return false;

        isSyncing = true;
        try {
            const data = {
                posts: posts,
                chat: chatMessages,
                updated: new Date().toISOString(),
                version: '1.0'
            };
            
            const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                console.log('✅ Сохранено в облако:', posts.length, 'постов');
                lastSyncTime = Date.now();
                isSyncing = false;
                return true;
            } else {
                console.error('❌ Ошибка сохранения в облако:', response.status);
                isSyncing = false;
                return false;
            }
        } catch (e) {
            console.error('❌ Ошибка сохранения в облако:', e.message);
            isSyncing = false;
            return false;
        }
    }

    // ========== РАБОТА С LOCALSTORAGE ==========
    function loadFromLocalStorage() {
        try {
            const savedPosts = localStorage.getItem('sovyonok_posts');
            if (savedPosts) {
                const parsed = JSON.parse(savedPosts);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    posts = parsed;
                    console.log('💾 Загружено из localStorage:', posts.length, 'постов');
                    return true;
                }
            }
            return false;
        } catch (e) {
            console.warn('❌ Ошибка загрузки из localStorage:', e);
            return false;
        }
    }

    function loadChatFromLocalStorage() {
        try {
            const savedChat = localStorage.getItem('sovyonok_chat');
            if (savedChat) {
                const parsed = JSON.parse(savedChat);
                if (Array.isArray(parsed)) {
                    chatMessages = parsed;
                    console.log('💾 Загружено чатов из localStorage:', chatMessages.length);
                    return true;
                }
            }
            return false;
        } catch (e) {
            console.warn('❌ Ошибка загрузки чата из localStorage:', e);
            return false;
        }
    }

    function saveToLocalStorage() {
        try {
            localStorage.setItem('sovyonok_posts', JSON.stringify(posts));
            localStorage.setItem('sovyonok_chat', JSON.stringify(chatMessages));
            console.log('💾 Сохранено в localStorage. Постов:', posts.length);
            return true;
        } catch (e) {
            console.error('❌ Ошибка сохранения в localStorage:', e);
            return false;
        }
    }

    // ========== ГЛАВНАЯ ФУНКЦИЯ СОХРАНЕНИЯ ==========
    async function saveAll() {
        const localSaved = saveToLocalStorage();
        if (isCloudConfigured()) {
            await saveToCloud();
        }
        return localSaved;
    }

    // ========== ВОССТАНОВЛЕНИЕ ДАННЫХ ==========
    async function restoreData() {
        console.log('🔄 Восстановление данных...');
        
        // 1. Пробуем загрузить из localStorage
        let hasLocalData = loadFromLocalStorage();
        loadChatFromLocalStorage();
        
        if (hasLocalData && posts.length > 0) {
            console.log('✅ Данные восстановлены из localStorage:', posts.length, 'постов');
            renderAll();
            
            // Отправляем локальные данные в облако
            if (isCloudConfigured()) {
                await saveToCloud();
                console.log('✅ Локальные данные отправлены в облако');
            }
            return true;
        }
        
        // 2. Если в localStorage нет - пробуем облако
        if (isCloudConfigured()) {
            const cloudLoaded = await loadFromCloud();
            if (cloudLoaded && posts.length > 0) {
                console.log('✅ Данные восстановлены из облака:', posts.length, 'постов');
                renderAll();
                return true;
            }
        }
        
        // 3. Если ничего нет - создаем демо
        console.log('📦 Создание демо-данных...');
        initDemoData();
        await saveAll();
        renderAll();
        return false;
    }

    // ========== СЖАТИЕ ИЗОБРАЖЕНИЙ ==========
    function compressImage(dataUrl, maxSize = MAX_IMAGE_SIZE) {
        return new Promise((resolve) => {
            if (!dataUrl) { resolve(null); return; }
            if (dataUrl.length < maxSize) { resolve(dataUrl); return; }

            const img = new Image();
            img.onload = function() {
                let width = img.width;
                let height = img.height;
                const maxDim = 800;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round(height * (maxDim / width));
                        width = maxDim;
                    } else {
                        width = Math.round(width * (maxDim / height));
                        height = maxDim;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                let quality = 0.8;
                let result = canvas.toDataURL('image/jpeg', quality);
                while (result.length > maxSize && quality > 0.2) {
                    quality -= 0.1;
                    result = canvas.toDataURL('image/jpeg', quality);
                }
                resolve(result);
            };
            img.onerror = function() { resolve(dataUrl); };
            img.src = dataUrl;
        });
    }

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

    function formatTextWithBreaks(text) {
        if (!text) return '';
        return escapeHTML(text).replace(/\n/g, '<br>');
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

    // ========== ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ ==========
    function discussInChat(postId) {
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        currentDiscussPost = postId;
        const shortText = post.text.length > 50 ? post.text.substring(0, 50) + '...' : post.text;
        chatPostText.textContent = '"' + shortText + '"';
        chatPostRef.style.display = 'block';
        switchPage('chat');
        setTimeout(() => { chatMessageInput.focus(); }, 300);
    }

    if (clearChatRef) {
        clearChatRef.addEventListener('click', function() {
            chatPostRef.style.display = 'none';
            currentDiscussPost = null;
        });
    }

    function switchPage(pageId) {
        if (editingPost) cancelEdit();
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
        if (!post) { alert('Пост не найден!'); return; }
        if (editingPost) cancelEdit();
        editingPost = { postId: post.id, text: post.text, imageData: post.imageData };
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
        const feedPage = document.getElementById('feedPage');
        if (!feedPage.classList.contains('active')) switchPage('feed');
        document.getElementById('createPostArea').scrollIntoView({ behavior: 'smooth', block: 'center' });
        postInput.focus();
    }

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
        if (!isDeveloper) { alert('Только разработчик может удалять посты!'); return false; }
        if (confirm('Вы уверены, что хотите удалить этот пост?')) {
            posts = posts.filter(p => p.id !== postId);
            saveAll();
            renderAll();
            alert('Пост удалён!');
            return true;
        }
        return false;
    }

    function deleteChatMessage(msgId) {
        if (!isDeveloper) { alert('Только разработчик может удалять сообщения!'); return false; }
        if (confirm('Удалить это сообщение?')) {
            chatMessages = chatMessages.filter(m => m.id !== msgId);
            saveAll();
            renderChat();
            return true;
        }
        return false;
    }

    // ========== РЕНДЕРИНГ ==========
    function renderComments(comments, postId, isReply = false) {
        if (!comments || comments.length === 0) return '';
        let html = '';
        for (const comment of comments) {
            const repliesHtml = comment.replies && comment.replies.length > 0 
                ? `<div class="replies">${renderComments(comment.replies, postId, true)}</div>` : '';
            const replyBtn = !isReply ? `
                <button class="reply-btn" data-reply-to="${postId}|${comment.id}|${escapeHTML(comment.author)}">
                    <i class="fas fa-reply"></i> Ответить
                </button>` : '';
            const deleteBtn = isDeveloper ? `
                <span class="comment-delete" data-del-comment="${postId}|${comment.id}">
                    <i class="fas fa-times"></i>
                </span>` : '';
            html += `
                <div class="comment-item" data-comment-id="${comment.id}">
                    <div class="comment-header">
                        <span class="comment-author">${escapeHTML(comment.author)}</span>
                        ${deleteBtn}
                    </div>
                    <div class="comment-text">${formatTextWithBreaks(comment.text)}</div>
                    <div class="comment-actions">${replyBtn}</div>
                    ${repliesHtml}
                </div>`;
        }
        return html;
    }

    function renderFeed(container = feedContainer, showAll = true) {
        let filteredPosts = showAll ? posts : posts.filter(p => p.bookmarked);
        if (!filteredPosts.length) {
            const message = showAll ? 'Новостей пока нет' : 'У вас пока нет сохранённых постов';
            container.innerHTML = `
                <div class="empty-feed">
                    <i class="far ${showAll ? 'fa-newspaper' : 'fa-bookmark'}"></i>
                    <p>${message}</p>
                    ${showAll ? '<p style="font-size:0.85rem; opacity:0.6;">Добро пожаловать в клуб "Совёнок"!</p>' : ''}
                </div>`;
            return;
        }
        let html = '';
        for (let i = 0; i < filteredPosts.length; i++) {
            const post = filteredPosts[i];
            const comments = post.comments || [];
            const likes = post.likes || 0;
            const liked = post.likedByUser || false;
            const bookmarked = post.bookmarked || false;
            let imageHtml = post.imageData ? `
                <div class="post-image">
                    <img src="${escapeHTML(post.imageData)}" alt="Изображение к посту" loading="lazy" />
                </div>` : '';
            const deleteBtn = isDeveloper ? `
                <button class="delete-post-btn" data-delete-post="${post.id}" title="Удалить пост">
                    <i class="fas fa-trash-alt"></i>
                </button>` : '';
            const editBtn = isDeveloper ? `
                <button class="edit-post-btn" data-edit-post="${post.id}" title="Редактировать пост">
                    <i class="fas fa-pen"></i>
                </button>` : '';
            let replyIndicator = '';
            if (replyToComment && replyToComment.postId === post.id) {
                replyIndicator = `
                    <div style="background:#fef5ea; padding:6px 12px; border-radius:12px; margin-bottom:6px; font-size:0.8rem; color:#5a2d0c; border:2px dashed #f5a97f;">
                        <i class="fas fa-reply"></i> Ответ для <strong>${escapeHTML(replyToComment.author)}</strong>
                        <button id="cancelReply" style="background:none; border:none; color:#ff6b6b; cursor:pointer; margin-left:8px;">✕</button>
                    </div>`;
            }
            html += `
                <div class="post-card" data-post-id="${post.id}">
                    <div class="post-header">
                        <div class="post-author"><i class="fas fa-feather-alt"></i> Совёнок</div>
                        <div class="post-header-actions">${editBtn}${deleteBtn}</div>
                    </div>
                    <div class="post-content">${formatTextWithBreaks(post.text)}</div>
                    ${imageHtml}
                    <div class="post-actions">
                        <button class="action-btn ${liked ? 'liked' : ''}" data-like="${post.id}">
                            <i class="${liked ? 'fas' : 'far'} fa-heart"></i><span>${likes}</span>
                        </button>
                        <button class="action-btn ${bookmarked ? 'bookmarked' : ''}" data-bookmark="${post.id}">
                            <i class="${bookmarked ? 'fas' : 'far'} fa-bookmark"></i>
                            <span>${bookmarked ? 'В закладках' : 'Закладка'}</span>
                        </button>
                        <button class="action-btn" data-comment-toggle="${post.id}">
                            <i class="far fa-comment"></i><span>${comments.length}</span>
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
                </div>`;
        }
        container.innerHTML = html;
        const cancelBtn = document.getElementById('cancelReply');
        if (cancelBtn) cancelBtn.addEventListener('click', function() { replyToComment = null; renderAll(); });
        document.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const data = this.dataset.replyTo.split('|');
                replyToComment = { postId: data[0], commentId: data[1], author: data[2] };
                renderAll();
                const input = document.querySelector(`input[data-comment-input="${replyToComment.postId}"]`);
                if (input) { input.focus(); input.placeholder = `Ответ для ${replyToComment.author}...`; }
            });
        });
        document.querySelectorAll('.edit-post-btn').forEach(btn => {
            btn.addEventListener('click', function() { startEditPost(this.dataset.editPost); });
        });
        updateCounters();
        saveAll();
    }

    function renderAll() {
        renderFeed(feedContainer, true);
        renderFeed(bookmarksContainer, false);
        renderChat();
        updateCounters();
    }

    function renderChat() {
        if (!chatMessages.length) {
            chatMessagesEl.innerHTML = `
                <div class="chat-empty">
                    <i class="fas fa-comment-dots" style="font-size:1.8rem; opacity:0.3;"></i>
                    <p>Вопросов пока нет</p>
                    <p style="font-size:0.8rem; opacity:0.6;">Задайте первый вопрос о книгах или чтении!</p>
                </div>`;
            return;
        }
        let html = '';
        for (let i = chatMessages.length - 1; i >= 0; i--) {
            const msg = chatMessages[i];
            let nameDisplay = msg.isSovyonok ? '<span class="sovyonok">🦉 Совёнок</span>' :
                            msg.name ? escapeHTML(msg.name) : '<span class="anonymous">Аноним</span>';
            const deleteBtn = isDeveloper ? `
                <button class="msg-delete" data-delete-chat="${msg.id}">
                    <i class="fas fa-times"></i>
                </button>` : '';
            html += `
                <div class="chat-message" data-msg-id="${msg.id}">
                    <div class="msg-name">${nameDisplay}</div>
                    <div class="msg-text">${formatTextWithBreaks(msg.text)}</div>
                    ${deleteBtn}
                </div>`;
        }
        chatMessagesEl.innerHTML = html;
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        updateCounters();
        saveAll();
    }

    // ========== СОХРАНЕНИЕ/ПУБЛИКАЦИЯ ПОСТА ==========
    async function savePost(text, imageData) {
        if (!isDeveloper) {
            alert('❌ Только разработчик может публиковать посты!\nВойдите как разработчик (пароль: sovyonok2024)');
            return false;
        }
        const trimmed = text.trim();
        if (!trimmed && !imageData) {
            alert('Напишите текст или прикрепите фото!');
            return false;
        }
        let finalImageData = imageData;
        if (imageData) {
            try {
                finalImageData = await compressImage(imageData);
                console.log('🖼️ Изображение сжато. Размер:', (finalImageData.length / 1024).toFixed(1), 'KB');
            } catch (e) { console.warn('Ошибка сжатия:', e); }
        }
        if (editingPost) {
            const post = posts.find(p => p.id === editingPost.postId);
            if (post) {
                post.text = trimmed || '';
                post.imageData = finalImageData || null;
                editingPost = null;
                currentImageData = null;
                imagePreview.style.display = 'none';
                previewImg.src = '#';
                postInput.value = '';
                publishBtn.innerHTML = 'Опубликовать';
                publishBtn.style.background = '';
                await saveAll();
                renderAll();
                alert('✅ Пост обновлён!');
                return true;
            } else {
                cancelEdit();
                alert('❌ Ошибка: пост не найден');
                return false;
            }
        }
        const newPost = {
            id: generateId(),
            text: trimmed || '',
            likes: 0,
            likedByUser: false,
            bookmarked: false,
            imageData: finalImageData || null,
            comments: []
        };
        posts.unshift(newPost);
        currentImageData = null;
        imagePreview.style.display = 'none';
        previewImg.src = '#';
        await saveAll();
        renderAll();
        postInput.value = '';
        postInput.style.height = 'auto';
        alert('✅ Пост опубликован!');
        return true;
    }

    // ========== ДОБАВЛЕНИЕ КОММЕНТАРИЯ ==========
    function addComment(postId, text) {
        const trimmed = text.trim();
        if (!trimmed) { alert('Напишите комментарий!'); return false; }
        const post = posts.find(p => p.id === postId);
        if (!post) return false;
        if (replyToComment && replyToComment.postId === postId) {
            const parentComment = post.comments.find(c => c.id === replyToComment.commentId);
            if (parentComment) {
                if (!parentComment.replies) parentComment.replies = [];
                parentComment.replies.push({ id: generateId(), text: trimmed, author: 'Аноним' });
                replyToComment = null;
                saveAll();
                renderAll();
                return true;
            }
        }
        post.comments.push({ id: generateId(), text: trimmed, author: 'Аноним', replies: [] });
        saveAll();
        renderAll();
        return true;
    }

    function deleteComment(postId, commentId) {
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        for (const c of post.comments) {
            if (c.id === commentId) { post.comments = post.comments.filter(c => c.id !== commentId); break; }
            if (c.replies) {
                const replyIndex = c.replies.findIndex(r => r.id === commentId);
                if (replyIndex !== -1) { c.replies.splice(replyIndex, 1); break; }
            }
        }
        saveAll();
        renderAll();
    }

    // ========== ДОБАВЛЕНИЕ СООБЩЕНИЯ В ЧАТ ==========
    function addChatMessage(name, text) {
        const trimmed = text.trim();
        if (!trimmed) { alert('Напишите вопрос!'); return false; }
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
        chatMessages.push({
            id: generateId(),
            name: isDeveloper ? '' : (name ? name.trim() : ''),
            text: messageText,
            isSovyonok: isDeveloper
        });
        saveAll();
        renderChat();
        chatMessageInput.value = '';
        if (!isDeveloper) chatNameInput.value = '';
        return true;
    }

    // ========== ЛАЙК И ЗАКЛАДКА ==========
    function toggleLike(postId) {
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        post.likedByUser = !post.likedByUser;
        post.likes = post.likedByUser ? post.likes + 1 : post.likes - 1;
        if (post.likes < 0) post.likes = 0;
        saveAll();
        renderAll();
    }

    function toggleBookmark(postId) {
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        post.bookmarked = !post.bookmarked;
        saveAll();
        renderAll();
    }

    // ========== ДЕМО ДАННЫЕ ==========
    function initDemoData() {
        const texts = [
            '📚 Сегодня читали "Колобка" с малышами — восторг!',
            '🌟 Как привить любовь к чтению с пелёнок? Делитесь опытом!',
            '🦉 В клубе "Совёнок" стартует марафон "Сказка на ночь"!',
            '📖 Какие книги вы читаете с детьми перед сном?',
            '🎨 Творческая встреча: рисуем иллюстрации к любимым сказкам!',
            '📚 Подборка книг для детей 3-4 лет'
        ];
        posts = [];
        for (let i = 0; i < texts.length; i++) {
            posts.push({
                id: 'p' + (i + 1),
                text: texts[i],
                likes: Math.floor(Math.random() * 20) + 10,
                likedByUser: false,
                bookmarked: false,
                imageData: null,
                comments: []
            });
        }
        chatMessages = [
            { id: 'chat1', name: 'Мария', text: 'А кто-нибудь уже пробовал читать "Волшебника Изумрудного города" с детьми 4 лет?', isSovyonok: false },
            { id: 'chat2', name: 'Анна', text: 'Очень интересная тема! Моя дочка обожает сказки Пушкина', isSovyonok: false }
        ];
        console.log('📦 Созданы демо-данные:', posts.length, 'постов');
    }

    // ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
    document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
        btn.addEventListener('click', function() { switchPage(this.dataset.tab); });
    });

    if (imageUpload) {
        imageUpload.addEventListener('change', async function(e) {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                if (file.size > 5 * 1024 * 1024) {
                    alert('⚠️ Файл слишком большой (>5MB)');
                    this.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = async function(e) {
                    try {
                        const compressed = await compressImage(e.target.result);
                        currentImageData = compressed;
                        previewImg.src = compressed;
                        imagePreview.style.display = 'block';
                    } catch (error) {
                        console.error('Ошибка обработки изображения:', error);
                        alert('Ошибка обработки изображения');
                    }
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
            savePost(postInput.value, currentImageData);
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
            addChatMessage(chatNameInput.value, chatMessageInput.value);
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
        if (target.dataset.discuss) { discussInChat(target.dataset.discuss); return; }
        if (target.dataset.deletePost) { deletePost(target.dataset.deletePost); return; }
        if (target.dataset.deleteChat) { deleteChatMessage(target.dataset.deleteChat); return; }
        if (target.dataset.like) { toggleLike(target.dataset.like); return; }
        if (target.dataset.bookmark) { toggleBookmark(target.dataset.bookmark); return; }
        if (target.dataset.commentAdd) {
            const postId = target.dataset.commentAdd;
            const input = document.querySelector(`input[data-comment-input="${postId}"]`);
            if (input) {
                addComment(postId, input.value);
                input.value = '';
                if (replyToComment) { replyToComment = null; renderAll(); }
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
            if (replyToComment) { replyToComment = null; renderAll(); }
        }
    });

    // ========== ЗАПУСК ==========
    console.log('🚀 Запуск приложения...');
    checkDeveloper();
    initVisitorCounter();
    
    // Восстанавливаем данные
    restoreData().then(() => {
        console.log('🎉 Приложение готово!');
        console.log('👤 Режим разработчика:', isDeveloper ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН');
        console.log('📊 Всего постов:', posts.length);
        
        // Авто-синхронизация каждые 30 секунд
        setInterval(async () => {
            if (isCloudConfigured()) {
                await saveToCloud();
            }
        }, 30000);
    });

})();
