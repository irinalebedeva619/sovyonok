(function() {
    "use strict";

    // ============================================================
    //  👇👇👇 СЮДА ВСТАВЬ СВОИ ДАННЫЕ ИЗ SUPABASE 👇👇👇
    // ============================================================
    const SUPABASE_URL = 'https://yzhyjfcvkfsfzwuytqzx.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6aHlqZmN2a2ZzZnp3dXl0cXp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjM3ODIsImV4cCI6MjEwMTA5OTc4Mn0.yXSsfsx8sXU04HaHmiaLO-LhOfqWAeyQRQ5MNLkuwoA';
    // ============================================================

    const TABLE_NAME = 'posts';
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

    // ========== DOM ==========
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

    // ========== КЛЮЧ ДЛЯ ЛОКАЛЬНЫХ ЛАЙКОВ ==========
    const LIKES_KEY = 'sovyonok_likes';

    function loadLocalLikes() {
        try {
            const saved = localStorage.getItem(LIKES_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    }

    function saveLocalLikes(likesData) {
        try {
            localStorage.setItem(LIKES_KEY, JSON.stringify(likesData));
        } catch (e) {}
    }

    // ========== 60 ДЕМО ПОСТОВ ==========
    function createDemoPosts() {
        const texts = [
            '📚 Сегодня читали "Колобка" с малышами — восторг!',
            '🌟 Как привить любовь к чтению с пелёнок? Делитесь опытом!',
            '🦉 В клубе "Совёнок" стартует марафон "Сказка на ночь"!',
            '📖 Какие книги вы читаете с детьми перед сном?',
            '🎨 Творческая встреча: рисуем иллюстрации к любимым сказкам!',
            '📚 Подборка книг для детей 3-4 лет. Самые интересные!',
            '🌟 Чтение развивает фантазию и речь. Это доказано!',
            '🦉 Родительский клуб: обмен опытом.',
            '📖 Уютные вечера с книгой — лучший отдых.',
            '🎨 Как выбрать книгу по возрасту? Делюсь опытом.',
            '📚 Читаем вместе с детьми — строим будущее.',
            '🌟 Сказки народов мира. Мы начали с русских!',
            '🦉 Игровые методики обучения чтению.',
            '📖 Книги с картинками — первые шаги.',
            '🎨 Театр теней по сказкам. Дети в восторге!',
            '📚 Читательский дневник: идеи для заполнения.',
            '🌟 Приобщаем к чтению с раннего возраста.',
            '🦉 Семейные традиции: чтение по кругу.',
            '📖 Как отвечать на вопросы детей о прочитанном?',
            '🎨 Рисуем героев сказок.',
            '📚 Подборка книг для малышей 1-2 лет.',
            '🌟 Как превратить чтение в праздник?',
            '🦉 Развитие речи через чтение.',
            '📖 Ваша любимая детская книга? Делитесь!',
            '📚 Библиотека в детском саду: наши мероприятия.',
            '🎨 Конкурс рисунков по мотивам прочитанных книг.',
            '🌟 Сказкотерапия для детей.',
            '📖 Чтение с детьми — основа развития.',
            '🦉 Вечерние сказки: традиция нашей семьи.',
            '📚 Календарь чтения на месяц.',
            '🎨 Театрализованные представления по сказкам.',
            '🌟 Игры по мотивам любимых книг.',
            '📖 Моя первая книга: что выбрать?',
            '🦉 Книжный клуб для самых маленьких.',
            '📚 Семейное чтение: что это даёт ребёнку?',
            '🎨 Иллюстрации к стихам Агнии Барто.',
            '🌟 Книги о дружбе и добре.',
            '📖 Как читать детям, чтобы им было интересно?',
            '🦉 Наша библиотека: книжные новинки.',
            '📚 Развиваем эмоциональный интеллект через книги.',
            '🎨 Творческие задания по прочитанному.',
            '🌟 Стихи и сказки для малышей.',
            '📖 Книги о природе для детей.',
            '🦉 Как сохранить интерес к чтению на долгие годы?',
            '📚 Читаем вместе: семейный опыт.',
            '🎨 Рисуем персонажей сказок.',
            '🌟 Воспитание книгой: как это работает?',
            '📖 Какие книги читать детям 5-6 лет?',
            '🦉 Детская поэзия: учим стихи с удовольствием.',
            '📚 Как выбрать книгу для ребёнка в магазине?',
            '🎨 Мастер-класс: создаём книгу своими руками.',
            '🌟 Сказки в дорогу: что взять в поездку?',
            '📖 Чтение перед сном: традиция на все времена.',
            '🦉 Книги о животных для дошкольников.',
            '📚 Как обсуждать прочитанное с ребёнком?',
            '🎨 Интерактивные книги: наш опыт.',
            '🌟 Читаем вместе в выходной день.',
            '📖 Книги для развития речи и мышления.',
            '🦉 Наша семейная библиотека: любимые книги.',
            '📚 Как заинтересовать ребёнка чтением?'
        ];

        const likesList = [
            35,42,38,51,45,47,39,53,41,44,
            36,50,43,48,37,46,55,40,52,35,
            44,49,57,39,47,41,45,52,38,49,
            42,50,37,46,43,51,40,48,44,53,
            36,47,42,50,39,45,52,41,49,43,
            46,38,54,40,48,42,51,37,49,44
        ];

        posts = [];
        for (let i = 0; i < 60; i++) {
            posts.push({
                id: 'p' + (i + 1),
                text: texts[i] || '📚 Читаем вместе!',
                likes: likesList[i] || 40,
                bookmarked: false,
                likedByUser: false,
                imageData: null,
                comments: []
            });
        }
        chatMessages = [
            { id: 'chat1', name: 'Мария', text: 'А кто-нибудь уже пробовал читать "Волшебника Изумрудного города" с детьми 4 лет?', isSovyonok: false },
            { id: 'chat2', name: 'Анна', text: 'Очень интересная тема! Моя дочка обожает сказки Пушкина', isSovyonok: false },
            { id: 'chat3', name: 'Елена', text: 'А как вы приучаете детей к чтению, если они не хотят сидеть на месте?', isSovyonok: false }
        ];
        console.log('📦 Создано 60 демо-постов!');
    }

    // ========== SUPABASE ==========
    async function loadFromSupabase() {
        try {
            console.log('☁️ Загрузка из Supabase...');
            const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    const record = data.find(item => item.id === 'sovyonok_data');
                    if (record && record.posts && record.posts.length > 0) {
                        posts = record.posts;
                        chatMessages = record.chat || [];
                        console.log('✅ Загружено из Supabase:', posts.length, 'постов');
                        saveToLocalStorage();
                        return true;
                    }
                }
                return false;
            }
            return false;
        } catch (e) {
            console.warn('❌ Ошибка соединения с Supabase:', e.message);
            return false;
        }
    }

    async function saveToSupabase() {
        if (isSyncing) return false;
        isSyncing = true;
        
        try {
            // Копируем посты и удаляем likedByUser (это локальные данные)
            const cleanPosts = posts.map(post => {
                const { likedByUser, ...cleanPost } = post;
                return cleanPost;
            });
            
            const data = {
                id: 'sovyonok_data',
                posts: cleanPosts,
                chat: chatMessages,
                updated_at: new Date().toISOString()
            };
            
            // Проверяем, есть ли запись
            const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.sovyonok_data`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            if (checkResponse.ok) {
                const existing = await checkResponse.json();
                
                let response;
                if (existing && existing.length > 0) {
                    response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.sovyonok_data`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                        },
                        body: JSON.stringify(data)
                    });
                } else {
                    response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                        },
                        body: JSON.stringify(data)
                    });
                }
                
                if (response.ok) {
                    console.log('✅ Сохранено в Supabase:', posts.length, 'постов');
                    isSyncing = false;
                    return true;
                } else {
                    console.error('❌ Ошибка сохранения в Supabase:', response.status);
                    isSyncing = false;
                    return false;
                }
            }
            isSyncing = false;
            return false;
        } catch (e) {
            console.error('❌ Ошибка сохранения в Supabase:', e.message);
            isSyncing = false;
            return false;
        }
    }

    // ========== LOCALSTORAGE ==========
    function saveToLocalStorage() {
        try {
            localStorage.setItem('sovyonok_posts', JSON.stringify(posts));
            localStorage.setItem('sovyonok_chat', JSON.stringify(chatMessages));
            return true;
        } catch (e) {
            console.error('❌ Ошибка localStorage:', e);
            return false;
        }
    }

    function loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('sovyonok_posts');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    posts = parsed;
                    return true;
                }
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    function loadChatFromLocalStorage() {
        try {
            const saved = localStorage.getItem('sovyonok_chat');
            if (saved) {
                chatMessages = JSON.parse(saved);
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    // ========== СОХРАНЕНИЕ ==========
    async function saveAll() {
        saveToLocalStorage();
        if (SUPABASE_URL && SUPABASE_URL !== 'https://ТВОЙ_ПРОЕКТ.supabase.co') {
            await saveToSupabase();
        }
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    async function initializeData() {
        console.log('🚀 Запуск...');
        console.log('☁️ Supabase:', SUPABASE_URL !== 'https://ТВОЙ_ПРОЕКТ.supabase.co' ? 'ВКЛЮЧЕН ✅' : 'ОТКЛЮЧЕН ❌');
        
        let loaded = false;
        
        if (SUPABASE_URL && SUPABASE_URL !== 'https://ТВОЙ_ПРОЕКТ.supabase.co') {
            loaded = await loadFromSupabase();
        }
        
        if (!loaded) {
            loaded = loadFromLocalStorage();
            loadChatFromLocalStorage();
            if (loaded) console.log('💾 Загружено из localStorage (кеш)');
        }
        
        if (!loaded || posts.length === 0) {
            console.log('📦 Создаём 60 постов...');
            createDemoPosts();
            await saveAll();
        }
        
        // Применяем локальные лайки
        const localLikes = loadLocalLikes();
        posts.forEach(post => {
            if (localLikes[post.id] !== undefined) {
                post.likedByUser = localLikes[post.id];
            } else {
                post.likedByUser = false;
            }
        });
        
        renderAll();
        console.log('✅ Готово! Постов:', posts.length);
    }

    // ========== СЖАТИЕ ИЗОБРАЖЕНИЙ ==========
    function compressImage(dataUrl, maxSize = MAX_IMAGE_SIZE) {
        return new Promise((resolve) => {
            if (!dataUrl || dataUrl.length < maxSize) { resolve(dataUrl); return; }
            const img = new Image();
            img.onload = function() {
                let width = img.width, height = img.height;
                const maxDim = 800;
                if (width > maxDim || height > maxDim) {
                    if (width > height) { height = Math.round(height * (maxDim / width)); width = maxDim; }
                    else { width = Math.round(width * (maxDim / height)); height = maxDim; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                let quality = 0.8, result = canvas.toDataURL('image/jpeg', quality);
                while (result.length > maxSize && quality > 0.2) {
                    quality -= 0.1;
                    result = canvas.toDataURL('image/jpeg', quality);
                }
                resolve(result);
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        });
    }

    // ========== СЧЁТЧИК ==========
    function initVisitorCounter() {
        const today = new Date().toDateString();
        const lastVisit = localStorage.getItem('sovyonok_last_visit');
        const savedCount = localStorage.getItem('sovyonok_visitor_count');
        visitorCount = savedCount ? parseInt(savedCount) : 2350;
        if (lastVisit !== today) {
            visitorCount += 1;
            localStorage.setItem('sovyonok_last_visit', today);
            localStorage.setItem('sovyonok_visitor_count', visitorCount.toString());
        }
        if (visitorCountEl) visitorCountEl.textContent = visitorCount.toLocaleString('ru-RU');
    }

    // ========== МОДАЛКА ==========
    function openModal() {
        devModal.classList.add('active');
        devPassword.value = '';
        devError.style.display = 'none';
        devPassword.focus();
    }
    function closeModal() { devModal.classList.remove('active'); }
    devLoginBtn.addEventListener('click', openModal);
    devModalClose.addEventListener('click', closeModal);
    devModal.addEventListener('click', function(e) { if (e.target === this) closeModal(); });

    devLoginSubmit.addEventListener('click', function() {
        if (devPassword.value === DEV_PASSWORD) {
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
    devPassword.addEventListener('keydown', function(e) { if (e.key === 'Enter') devLoginSubmit.click(); });

    function logoutDeveloper() {
        if (confirm('Выйти из режима разработчика?')) {
            isDeveloper = false;
            localStorage.setItem('sovyonok_dev', 'false');
            updateDeveloperUI();
            alert('👋 Вы вышли из режима разработчика');
            renderAll();
        }
    }

    function checkDeveloper() {
        isDeveloper = localStorage.getItem('sovyonok_dev') === 'true';
        updateDeveloperUI();
    }

    function updateDeveloperUI() {
        const createArea = document.getElementById('createPostArea');
        if (createArea) createArea.style.display = isDeveloper ? 'block' : 'none';
        if (devLoginBtn) {
            if (isDeveloper) {
                devLoginBtn.innerHTML = '<i class="fas fa-user-cog"></i> Разработчик';
                devLoginBtn.className = 'nav-btn dev-btn active-dev';
                devLoginBtn.onclick = function(e) { e.stopPropagation(); logoutDeveloper(); };
            } else {
                devLoginBtn.innerHTML = '<i class="fas fa-user-cog"></i> Войти';
                devLoginBtn.className = 'nav-btn dev-btn';
                devLoginBtn.onclick = function(e) { e.stopPropagation(); openModal(); };
            }
        }
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ ==========
    function generateId() { return Date.now() + '-' + Math.random().toString(36).substring(2, 9); }
    function escapeHTML(text) { if (!text) return ''; return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function formatTextWithBreaks(text) { if (!text) return ''; return escapeHTML(text).replace(/\n/g, '<br>'); }

    function getBookmarkCount() { return posts.filter(p => p.bookmarked).length; }
    function getChatCount() { return chatMessages.length; }
    function updateCounters() {
        if (bookmarkCount) bookmarkCount.textContent = getBookmarkCount();
        if (chatCount) chatCount.textContent = getChatCount();
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

    // ========== РЕДАКТИРОВАНИЕ ==========
    function startEditPost(postId) {
        if (!isDeveloper) { alert('Только разработчик!'); return; }
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

    // ========== УДАЛЕНИЕ ==========
    function deletePost(postId) {
        if (!isDeveloper) { alert('Только разработчик!'); return false; }
        if (confirm('Удалить пост?')) {
            posts = posts.filter(p => p.id !== postId);
            saveAll();
            renderAll();
            alert('✅ Пост удалён!');
            return true;
        }
        return false;
    }

    function deleteChatMessage(msgId) {
        if (!isDeveloper) { alert('Только разработчик!'); return false; }
        if (confirm('Удалить сообщение?')) {
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
            const replyBtn = !isReply ? `<button class="reply-btn" data-reply-to="${postId}|${comment.id}|${escapeHTML(comment.author)}"><i class="fas fa-reply"></i> Ответить</button>` : '';
            const deleteBtn = isDeveloper ? `<span class="comment-delete" data-del-comment="${postId}|${comment.id}"><i class="fas fa-times"></i></span>` : '';
            html += `
                <div class="comment-item" data-comment-id="${comment.id}">
                    <div class="comment-header"><span class="comment-author">${escapeHTML(comment.author)}</span>${deleteBtn}</div>
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
            container.innerHTML = `<div class="empty-feed"><i class="far ${showAll ? 'fa-newspaper' : 'fa-bookmark'}"></i><p>${showAll ? 'Новостей пока нет' : 'Нет закладок'}</p></div>`;
            return;
        }
        let html = '';
        for (let i = 0; i < filteredPosts.length; i++) {
            const post = filteredPosts[i];
            const comments = post.comments || [];
            const likes = post.likes || 0;
            const liked = post.likedByUser || false;
            const bookmarked = post.bookmarked || false;
            let imageHtml = post.imageData ? `<div class="post-image"><img src="${escapeHTML(post.imageData)}" loading="lazy" /></div>` : '';
            const deleteBtn = isDeveloper ? `<button class="delete-post-btn" data-delete-post="${post.id}"><i class="fas fa-trash-alt"></i></button>` : '';
            const editBtn = isDeveloper ? `<button class="edit-post-btn" data-edit-post="${post.id}"><i class="fas fa-pen"></i></button>` : '';
            let replyIndicator = '';
            if (replyToComment && replyToComment.postId === post.id) {
                replyIndicator = `<div style="background:#fef5ea;padding:6px 12px;border-radius:12px;margin-bottom:6px;font-size:0.8rem;color:#5a2d0c;border:2px dashed #f5a97f;"><i class="fas fa-reply"></i> Ответ для <strong>${escapeHTML(replyToComment.author)}</strong><button id="cancelReply" style="background:none;border:none;color:#ff6b6b;cursor:pointer;margin-left:8px;">✕</button></div>`;
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
                            <i class="${liked ? 'fas' : 'far'} fa-heart"></i>
                            <span>${likes}</span>
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
                        <div class="comment-list">${renderComments(comments, post.id)}</div>
                    </div>
                </div>`;
        }
        container.innerHTML = html;
        document.getElementById('cancelReply')?.addEventListener('click', function() { replyToComment = null; renderAll(); });
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
            chatMessagesEl.innerHTML = `<div class="chat-empty"><i class="fas fa-comment-dots" style="font-size:1.8rem;opacity:0.3;"></i><p>Вопросов пока нет</p></div>`;
            return;
        }
        let html = '';
        for (let i = chatMessages.length - 1; i >= 0; i--) {
            const msg = chatMessages[i];
            let nameDisplay = msg.isSovyonok ? '<span class="sovyonok">🦉 Совёнок</span>' : (msg.name ? escapeHTML(msg.name) : '<span class="anonymous">Аноним</span>');
            const deleteBtn = isDeveloper ? `<button class="msg-delete" data-delete-chat="${msg.id}"><i class="fas fa-times"></i></button>` : '';
            html += `<div class="chat-message"><div class="msg-name">${nameDisplay}</div><div class="msg-text">${formatTextWithBreaks(msg.text)}</div>${deleteBtn}</div>`;
        }
        chatMessagesEl.innerHTML = html;
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        updateCounters();
        saveAll();
    }

    // ========== ЛАЙК (ЛОКАЛЬНЫЙ СТАТУС + ГЛОБАЛЬНЫЙ СЧЁТЧИК) ==========
    function toggleLike(postId) {
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        
        const localLikes = loadLocalLikes();
        const currentLiked = localLikes[postId] || false;
        localLikes[postId] = !currentLiked;
        
        post.likes = localLikes[postId] ? post.likes + 1 : post.likes - 1;
        if (post.likes < 0) post.likes = 0;
        post.likedByUser = localLikes[postId];
        
        saveLocalLikes(localLikes);
        saveAll();
        renderAll();
    }

    // ========== ЛИЧНАЯ ЗАКЛАДКА ==========
    function toggleBookmark(postId) {
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        
        post.bookmarked = !post.bookmarked;
        saveAll();
        renderAll();
    }

    // ========== СОХРАНЕНИЕ ПОСТА ==========
    async function savePost(text, imageData) {
        if (!isDeveloper) {
            alert('❌ Только разработчик!\nПароль: sovyonok2024');
            return false;
        }
        
        const trimmed = text.trim();
        if (!trimmed && !imageData) { 
            alert('Напишите текст!'); 
            return false; 
        }
        
        let finalImageData = imageData;
        if (imageData) {
            try { 
                finalImageData = await compressImage(imageData); 
            } catch(e) {}
        }
        
        // РЕДАКТИРОВАНИЕ
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
        
        // НОВЫЙ ПОСТ
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
        alert('✅ Пост опубликован!');
        return true;
    }

    // ========== ГЛОБАЛЬНЫЕ КОММЕНТАРИИ ==========
    function addComment(postId, text) {
        const trimmed = text.trim();
        if (!trimmed) { alert('Напишите комментарий!'); return false; }
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
                saveAll();
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
        saveAll();
        renderAll();
        return true;
    }

    function deleteComment(postId, commentId) {
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        for (const c of post.comments) {
            if (c.id === commentId) { 
                post.comments = post.comments.filter(c => c.id !== commentId); 
                break; 
            }
            if (c.replies) {
                const replyIndex = c.replies.findIndex(r => r.id === commentId);
                if (replyIndex !== -1) { 
                    c.replies.splice(replyIndex, 1); 
                    break; 
                }
            }
        }
        saveAll();
        renderAll();
    }

    // ========== ГЛОБАЛЬНЫЙ ЧАТ ==========
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

    // ========== ОБРАБОТЧИКИ ==========
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
                        console.error('Ошибка:', error);
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

    // ========== ДЕЛЕГИРОВАНИЕ ==========
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
    console.log('🚀 Запуск...');
    checkDeveloper();
    initVisitorCounter();
    
    initializeData().then(() => {
        console.log('🎉 Готово! Постов:', posts.length);
        
        setInterval(async () => {
            if (SUPABASE_URL && SUPABASE_URL !== 'https://ТВОЙ_ПРОЕКТ.supabase.co') {
                await saveToSupabase();
            }
        }, 30000);
        
        setInterval(async () => {
            if (SUPABASE_URL && SUPABASE_URL !== 'https://ТВОЙ_ПРОЕКТ.supabase.co') {
                try {
                    const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*`, {
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.length > 0) {
                            const record = data.find(item => item.id === 'sovyonok_data');
                            if (record && record.posts) {
                                const currentPosts = JSON.stringify(posts);
                                const newPosts = JSON.stringify(record.posts);
                                
                                if (currentPosts !== newPosts) {
                                    console.log('🔄 Обнаружены изменения в облаке! Обновляем...');
                                    posts = record.posts;
                                    chatMessages = record.chat || [];
                                    
                                    const localLikes = loadLocalLikes();
                                    posts.forEach(post => {
                                        post.likedByUser = localLikes[post.id] || false;
                                    });
                                    
                                    saveToLocalStorage();
                                    renderAll();
                                }
                            }
                        }
                    }
                } catch (e) {}
            }
        }, 15000);
    });

})();
