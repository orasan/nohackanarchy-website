// Global variables
let blogData = null;
let currentPosts = [];
let currentPage = 1;
let postsPerPage = 5;
let isAdminMode = false;
let currentFilter = 'all';
let currentEditorMode = 'visual';
let uploadedImages = [];

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
async function initializeApp() {
    await loadBlogData();
    initializeNavigation();
    initializeBlogFunctionality();
    initializeAnimations();
    initializeScrollEffects();
    initializeAdminPanel();
    initializeEditor();
    renderBlogPosts();
}

// Initialize rich text editor
function initializeEditor() {
    // Editor mode toggle
    const visualBtn = document.getElementById('editor-visual');
    const markdownBtn = document.getElementById('editor-markdown');
    const previewBtn = document.getElementById('editor-preview');
    
    const visualEditor = document.getElementById('visual-editor');
    const markdownEditor = document.getElementById('markdown-editor');
    const previewArea = document.getElementById('preview-area');

    visualBtn?.addEventListener('click', () => switchEditorMode('visual'));
    markdownBtn?.addEventListener('click', () => switchEditorMode('markdown'));
    previewBtn?.addEventListener('click', () => switchEditorMode('preview'));

    // Rich text editor toolbar
    const toolbar = document.querySelector('.editor-toolbar');
    toolbar?.addEventListener('click', handleToolbarClick);

    // Image upload
    const imageUpload = document.getElementById('image-upload');
    const uploadZone = document.querySelector('.upload-zone');
    
    imageUpload?.addEventListener('change', handleImageUpload);
    uploadZone?.addEventListener('dragover', handleDragOver);
    uploadZone?.addEventListener('drop', handleImageDrop);

    // Insert image and link buttons
    document.getElementById('insert-image')?.addEventListener('click', insertImageDialog);
    document.getElementById('insert-link')?.addEventListener('click', insertLinkDialog);

    // Save draft
    document.getElementById('save-draft')?.addEventListener('click', saveDraft);
}

// Switch editor mode
function switchEditorMode(mode) {
    currentEditorMode = mode;
    
    // Update button states
    document.querySelectorAll('.editor-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`editor-${mode}`).classList.add('active');
    
    // Show/hide editor panels
    document.getElementById('visual-editor').style.display = mode === 'visual' ? 'block' : 'none';
    document.getElementById('markdown-editor').style.display = mode === 'markdown' ? 'block' : 'none';
    document.getElementById('preview-area').style.display = mode === 'preview' ? 'block' : 'none';
    
    if (mode === 'preview') {
        updatePreview();
    }
}

// Handle toolbar clicks
function handleToolbarClick(e) {
    const command = e.target.getAttribute('data-command');
    if (command) {
        e.preventDefault();
        document.execCommand(command, false, null);
        document.getElementById('content-editor').focus();
    }
}

// Insert markdown syntax
function insertMarkdown(before, after) {
    const textarea = document.getElementById('markdown-content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    const newText = before + selectedText + after;
    textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
    
    // Set cursor position
    const newCursorPos = start + before.length + selectedText.length + after.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();
}

// Update preview
function updatePreview() {
    const previewDiv = document.getElementById('content-preview');
    let content = '';
    
    if (currentEditorMode === 'preview') {
        if (document.getElementById('visual-editor').style.display !== 'none') {
            content = document.getElementById('content-editor').innerHTML;
        } else {
            content = markdownToHtml(document.getElementById('markdown-content').value);
        }
        
        previewDiv.innerHTML = content;
    }
}

// Simple markdown to HTML converter
function markdownToHtml(markdown) {
    return markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" style="max-width: 100%; height: auto;">')
        .replace(/\[([^\]]*)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/^- (.+)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n/g, '<br>');
}

// Handle image upload
function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    processImageFiles(files);
}

// Handle drag and drop
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleImageDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    processImageFiles(files);
}

// Process image files
function processImageFiles(files) {
    files.forEach(file => {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert(`${file.name} is too large. Maximum size is 5MB.`);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = {
                id: Date.now() + Math.random(),
                name: file.name,
                data: e.target.result,
                size: file.size
            };
            
            uploadedImages.push(imageData);
            renderImageGallery();
        };
        reader.readAsDataURL(file);
    });
}

// Render image gallery
function renderImageGallery() {
    const gallery = document.getElementById('image-gallery');
    if (!gallery) return;
    
    gallery.innerHTML = uploadedImages.map(image => `
        <div class="image-item" data-id="${image.id}">
            <img src="${image.data}" alt="${image.name}">
            <div class="image-name">${image.name}</div>
            <div class="image-actions">
                <button onclick="insertImageIntoEditor('${image.data}', '${image.name}')">挿入</button>
                <button onclick="copyImageUrl('${image.data}')" title="URLをコピー">📋</button>
                <button onclick="deleteImage('${image.id}')" class="delete-image">削除</button>
            </div>
        </div>
    `).join('');
}

// Insert image into editor
function insertImageIntoEditor(imageData, imageName) {
    if (currentEditorMode === 'visual') {
        const editor = document.getElementById('content-editor');
        const img = document.createElement('img');
        img.src = imageData;
        img.alt = imageName;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        
        editor.appendChild(img);
        editor.appendChild(document.createElement('br'));
    } else if (currentEditorMode === 'markdown') {
        const textarea = document.getElementById('markdown-content');
        const markdownImg = `![${imageName}](${imageData})`;
        textarea.value += '\n' + markdownImg + '\n';
    }
    
    showNotification('画像を挿入しました');
}

// Copy image URL
function copyImageUrl(imageData) {
    navigator.clipboard.writeText(imageData).then(() => {
        showNotification('画像URLをクリップボードにコピーしました');
    });
}

// Delete image
function deleteImage(imageId) {
    uploadedImages = uploadedImages.filter(img => img.id !== imageId);
    renderImageGallery();
    showNotification('画像を削除しました');
}

// Insert image dialog
function insertImageDialog() {
    const url = prompt('画像URLを入力してください:');
    if (url) {
        insertImageIntoEditor(url, 'Image');
    }
}

// Insert link dialog
function insertLinkDialog() {
    const url = prompt('リンクURLを入力してください:');
    if (url) {
        const text = prompt('リンクテキストを入力してください:', url);
        if (text) {
            if (currentEditorMode === 'visual') {
                document.execCommand('createLink', false, url);
            } else if (currentEditorMode === 'markdown') {
                insertMarkdown(`[${text}](`, ')');
            }
        }
    }
}

// Save draft
function saveDraft() {
    const postData = getPostData();
    const draftKey = 'blog_draft_' + (postData.id || 'new');
    localStorage.setItem(draftKey, JSON.stringify(postData));
    showNotification('下書きを保存しました');
}

// Get post data from form
function getPostData() {
    const id = document.getElementById('post-id').value;
    const title = document.getElementById('post-title').value;
    const author = document.getElementById('post-author').value;
    const category = document.getElementById('post-category').value;
    const featured = document.getElementById('post-featured').checked;
    
    let content = '';
    if (currentEditorMode === 'visual') {
        content = document.getElementById('content-editor').innerHTML;
    } else {
        content = document.getElementById('markdown-content').value;
    }
    
    return {
        id: id || null,
        title,
        content,
        author,
        category,
        featured,
        images: uploadedImages
    };
}

// Load blog data from JSON (GitHub Pages compatible)
async function loadBlogData() {
    try {
        // GitHub Pages では相対パスでJSONを読み込み
        const response = await fetch('./blog-data.json');
        if (!response.ok) {
            throw new Error('Failed to load blog data');
        }
        blogData = await response.json();
        currentPosts = [...blogData.posts];
        console.log('Blog data loaded successfully from GitHub Pages');
    } catch (error) {
        console.error('Error loading blog data:', error);
        // GitHub Pages フォールバック用のサンプルデータ
        blogData = {
            posts: [
                {
                    id: 1,
                    date: "2025-06-16",
                    title: "GitHub Pagesでサイト公開！",
                    content: "NoHackAnarchyサイトがGitHub Pagesで公開されました！\n\n**新機能:**\n• 高速な配信\n• 無料ホスティング\n• 自動HTTPS\n• カスタムドメイン対応\n\nぜひご活用ください！",
                    author: "admin",
                    category: "announcement",
                    featured: true
                },
                {
                    id: 2,
                    date: "2025-06-16", 
                    title: "GitHub経由でのブログ更新方法",
                    content: "GitHub Pagesでブログを更新する方法:\n\n1. リポジトリのblog-data.jsonを編集\n2. 新しい記事を追加\n3. コミット&プッシュで自動反映\n\n**注意:** 管理パネルでの編集は一時的です。永続化にはGitHub経由での更新が必要です。",
                    author: "admin", 
                    category: "update",
                    featured: false
                }
            ],
            categories: {
                announcement: { name: "発表", color: "#5865f2", icon: "📢" },
                important: { name: "重要", color: "#e94560", icon: "⚠️" },
                update: { name: "アップデート", color: "#27ae60", icon: "🔄" },
                maintenance: { name: "メンテナンス", color: "#f39c12", icon: "🔧" }
            }
        };
        currentPosts = [...blogData.posts];
    }
}

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-menu a');
    const homeContent = document.getElementById('home-content');
    const blogContent = document.getElementById('blog-content');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get the tab type from data attribute
            const tab = this.getAttribute('data-tab');
            
            // Handle navigation
            if (tab === 'blog') {
                homeContent.style.display = 'none';
                blogContent.style.display = 'block';
                renderBlogPosts();
            } else {
                homeContent.style.display = 'block';
                blogContent.style.display = 'none';
            }
            
            // Scroll to top smoothly
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });
}

// Blog functionality
function initializeBlogFunctionality() {
    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            currentFilter = this.getAttribute('data-filter');
            filterPosts();
        });
    });

    // Search functionality
    const searchInput = document.getElementById('blog-search');
    const searchBtn = document.getElementById('search-btn');
    
    searchInput.addEventListener('input', debounce(searchPosts, 300));
    searchBtn.addEventListener('click', searchPosts);
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchPosts();
        }
    });
}

// Filter posts by category
function filterPosts() {
    let filteredPosts = [...blogData.posts];
    
    if (currentFilter !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.category === currentFilter);
    }
    
    currentPosts = filteredPosts;
    currentPage = 1;
    renderBlogPosts();
}

// Search posts
function searchPosts() {
    const searchTerm = document.getElementById('blog-search').value.toLowerCase();
    
    if (!searchTerm) {
        filterPosts();
        return;
    }
    
    const searchResults = currentPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        post.author.toLowerCase().includes(searchTerm)
    );
    
    currentPosts = searchResults;
    currentPage = 1;
    renderBlogPosts();
}

// Render blog posts
function renderBlogPosts() {
    const container = document.getElementById('blog-posts');
    const paginationContainer = document.getElementById('blog-pagination');
    
    if (!container || !blogData) return;
    
    // Sort posts by date (newest first)
    currentPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate pagination
    const totalPages = Math.ceil(currentPosts.length / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToShow = currentPosts.slice(startIndex, endIndex);
    
    // Clear container
    container.innerHTML = '';
    
    if (postsToShow.length === 0) {
        container.innerHTML = '<div class="no-posts">投稿が見つかりませんでした。</div>';
        paginationContainer.innerHTML = '';
        return;
    }
    
    // Render posts
    postsToShow.forEach(post => {
        const postElement = createPostElement(post);
        container.appendChild(postElement);
    });
    
    // Render pagination
    renderPagination(totalPages);
    
    // Re-initialize animations for new posts
    initializeBlogAnimations();
}

// Create post element
function createPostElement(post) {
    const article = document.createElement('article');
    article.className = `blog-post ${post.featured ? 'featured' : ''}`;
    article.setAttribute('data-id', post.id);
    
    const category = blogData.categories[post.category];
    const formattedDate = formatDate(post.date);
    
    article.innerHTML = `
        <div class="blog-meta">
            <span class="blog-date">${formattedDate}</span>
            <span class="blog-tag ${post.category}">${category.icon} ${category.name}</span>
        </div>
        <h3 class="blog-title">${post.title}</h3>
        <div class="blog-content">${formatContent(post.content)}</div>
        <div class="blog-author">著者: ${post.author}</div>
        ${isAdminMode ? `
            <div class="blog-actions">
                <button onclick="editPost(${post.id})" class="edit-btn">編集</button>
                <button onclick="deletePost(${post.id})" class="delete-btn">削除</button>
            </div>
        ` : ''}
    `;
    
    return article;
}

// Format post content
function formatContent(content) {
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/• /g, '<li>')
        .replace(/\n/g, '<br>');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Render pagination
function renderPagination(totalPages) {
    const container = document.getElementById('blog-pagination');
    if (!container || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="blog-nav-btn" onclick="changePage(${currentPage - 1})">← 前へ</button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="blog-nav-btn active">${i}</button>`;
        } else if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
            paginationHTML += `<button class="blog-nav-btn" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<span class="blog-nav-dots">...</span>`;
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="blog-nav-btn next" onclick="changePage(${currentPage + 1})">次へ →</button>`;
    }
    
    container.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    currentPage = page;
    renderBlogPosts();
    
    // Scroll to top of blog section
    document.getElementById('blog-content').scrollIntoView({
        behavior: 'smooth'
    });
}

// Admin panel functionality
function initializeAdminPanel() {
    const adminToggle = document.getElementById('admin-toggle');
    const adminPanel = document.getElementById('admin-panel');
    const addPostBtn = document.getElementById('add-post-btn');
    const postForm = document.getElementById('post-form');
    const blogForm = document.getElementById('blog-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importArea = document.getElementById('import-area');
    const importConfirm = document.getElementById('import-confirm');
    const importCancel = document.getElementById('import-cancel');

    adminToggle.addEventListener('click', function() {
        if (!isAdminMode) {
            // パスワード認証
            const password = prompt('管理者パスワードを入力してください:');
            if (password !== 'nohack2025') {
                alert('パスワードが間違っています。');
                return;
            }
        }

        isAdminMode = !isAdminMode;
        
        if (isAdminMode) {
            adminPanel.style.display = 'block';
            this.textContent = '管理終了';
            this.style.color = 'var(--accent-red)';
            showNotification('管理モードが有効になりました。注意: 変更はリロード後に失われます。');
        } else {
            adminPanel.style.display = 'none';
            postForm.style.display = 'none';
            importArea.style.display = 'none';
            this.textContent = '管理';
            this.style.color = 'var(--text-secondary)';
        }
        
        renderBlogPosts(); // Re-render to show/hide edit buttons
    });

    addPostBtn.addEventListener('click', function() {
        resetForm();
        document.getElementById('form-title').textContent = '新しい記事を追加';
        postForm.style.display = 'block';
        importArea.style.display = 'none';
    });

    cancelBtn.addEventListener('click', function() {
        postForm.style.display = 'none';
        resetForm();
    });

    blogForm.addEventListener('submit', function(e) {
        e.preventDefault();
        savePost();
    });

    // Export functionality
    exportBtn.addEventListener('click', function() {
        exportBlogData();
    });

    // Import functionality
    importBtn.addEventListener('click', function() {
        postForm.style.display = 'none';
        importArea.style.display = 'block';
    });

    importConfirm.addEventListener('click', function() {
        importBlogData();
    });

    importCancel.addEventListener('click', function() {
        importArea.style.display = 'none';
        document.getElementById('import-data').value = '';
    });
}

// Reset form
function resetForm() {
    document.getElementById('post-id').value = '';
    document.getElementById('post-title').value = '';
    document.getElementById('post-author').value = '';
    document.getElementById('post-category').value = 'announcement';
    document.getElementById('post-featured').checked = false;
    
    // Clear editors
    document.getElementById('content-editor').innerHTML = '';
    document.getElementById('markdown-content').value = '';
    document.getElementById('content-preview').innerHTML = '';
    
    // Reset editor mode
    switchEditorMode('visual');
    
    // Clear uploaded images
    uploadedImages = [];
    renderImageGallery();
}

// Edit post
function editPost(id) {
    const post = blogData.posts.find(p => p.id === id);
    if (!post) return;

    document.getElementById('post-id').value = post.id;
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-author').value = post.author;
    document.getElementById('post-category').value = post.category;
    document.getElementById('post-featured').checked = post.featured;

    // Load content into editors
    document.getElementById('content-editor').innerHTML = post.content;
    document.getElementById('markdown-content').value = post.content;
    
    // Load images if available
    if (post.images) {
        uploadedImages = post.images;
        renderImageGallery();
    }

    document.getElementById('form-title').textContent = '記事を編集';
    document.getElementById('post-form').style.display = 'block';
    document.getElementById('import-area').style.display = 'none';

    // Scroll to form
    document.getElementById('post-form').scrollIntoView({
        behavior: 'smooth'
    });
}

// Delete post
function deletePost(id) {
    if (!confirm('この記事を削除しますか？')) return;

    blogData.posts = blogData.posts.filter(post => post.id !== id);
    filterPosts();
    
    showNotification('記事が削除されました。');
}

// Save post
function savePost() {
    const postData = getPostData();
    
    if (!postData.title || !postData.content || !postData.author) {
        alert('タイトル、本文、著者はすべて必須項目です。');
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    if (postData.id) {
        // Edit existing post
        const postIndex = blogData.posts.findIndex(p => p.id == postData.id);
        if (postIndex !== -1) {
            blogData.posts[postIndex] = {
                ...blogData.posts[postIndex],
                title: postData.title,
                content: postData.content,
                author: postData.author,
                category: postData.category,
                featured: postData.featured,
                images: postData.images
            };
        }
        showNotification('記事が更新されました。');
    } else {
        // Add new post
        const newId = Math.max(...blogData.posts.map(p => p.id)) + 1;
        const newPost = {
            id: newId,
            date: today,
            title: postData.title,
            content: postData.content,
            author: postData.author,
            category: postData.category,
            featured: postData.featured,
            images: postData.images
        };
        blogData.posts.unshift(newPost);
        showNotification('新しい記事が追加されました。');
    }

    // Clear draft
    const draftKey = 'blog_draft_' + (postData.id || 'new');
    localStorage.removeItem(draftKey);

    document.getElementById('post-form').style.display = 'none';
    resetForm();
    filterPosts();
}

// Export blog data
function exportBlogData() {
    const dataStr = JSON.stringify(blogData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'blog-data.json';
    link.click();
    
    showNotification('ブログデータをダウンロードしました。このファイルを保存してください。');
}

// Import blog data
function importBlogData() {
    const importData = document.getElementById('import-data').value;
    
    if (!importData.trim()) {
        alert('インポートするデータを入力してください。');
        return;
    }
    
    try {
        const newData = JSON.parse(importData);
        
        // Validate data structure
        if (!newData.posts || !Array.isArray(newData.posts) || !newData.categories) {
            throw new Error('無効なデータ形式です。');
        }
        
        // Confirm import
        if (!confirm(`${newData.posts.length}件の記事をインポートします。現在のデータは上書きされますが、リロード後は元に戻ります。続行しますか？`)) {
            return;
        }
        
        // Update blog data
        blogData = newData;
        currentPosts = [...blogData.posts];
        
        // Reset filters and render
        currentFilter = 'all';
        document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
        document.querySelectorAll('.filter-btn:not([data-filter="all"])').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('blog-search').value = '';
        
        renderBlogPosts();
        
        // Hide import area
        document.getElementById('import-area').style.display = 'none';
        document.getElementById('import-data').value = '';
        
        showNotification('データのインポートが完了しました。');
        
    } catch (error) {
        alert('データの読み込みに失敗しました: ' + error.message);
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-green);
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize animations
function initializeAnimations() {
    // Card hover effects
    const cards = document.querySelectorAll('.card, .blog-post');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('blog-post')) {
                this.style.transform = 'translateY(-8px)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('blog-post')) {
                this.style.transform = 'translateY(0)';
            }
        });
    });

    initializeBlogAnimations();
}

// Blog post scroll animations
function initializeBlogAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all blog posts
    const blogPosts = document.querySelectorAll('.blog-post');
    blogPosts.forEach(post => {
        post.style.opacity = '0';
        post.style.transform = 'translateY(30px)';
        post.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(post);
    });
}

// Scroll effects
function initializeScrollEffects() {
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(26, 26, 46, 0.98)';
        } else {
            navbar.style.background = 'rgba(26, 26, 46, 0.95)';
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Hero CTA click handler
document.addEventListener('DOMContentLoaded', function() {
    const heroCTA = document.querySelector('.hero-cta');
    if (heroCTA) {
        heroCTA.addEventListener('click', function(e) {
            e.preventDefault();
            const connectionInfo = document.querySelector('.connection-info');
            if (connectionInfo) {
                connectionInfo.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                
                // Add a subtle highlight effect
                connectionInfo.style.transform = 'scale(1.02)';
                connectionInfo.style.transition = 'transform 0.3s ease';
                
                setTimeout(() => {
                    connectionInfo.style.transform = 'scale(1)';
                }, 1000);
            }
        });
    }
});

// Initialize page state on load
function initializePageState() {
    const homeContent = document.getElementById('home-content');
    const blogContent = document.getElementById('blog-content');
    
    if (homeContent && blogContent) {
        homeContent.style.display = 'block';
        blogContent.style.display = 'none';
    }
    
    const homeTab = document.querySelector('a[data-tab="home"]');
    if (homeTab) {
        homeTab.classList.add('active');
    }
}

// Call initialization on load
document.addEventListener('DOMContentLoaded', initializePageState);

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .no-posts {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);
        font-size: 1.1rem;
    }
`;
document.head.appendChild(style);