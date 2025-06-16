// Global variables
let blogData = null;
let currentPosts = [];
let currentPage = 1;
let postsPerPage = 5;
let isAdminMode = false;
let currentFilter = 'all';

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
    renderBlogPosts();
}

// Load blog data from JSON
async function loadBlogData() {
    try {
        const response = await fetch('blog-data.json');
        if (!response.ok) {
            throw new Error('Failed to load blog data');
        }
        blogData = await response.json();
        currentPosts = [...blogData.posts];
        console.log('Blog data loaded successfully');
    } catch (error) {
        console.error('Error loading blog data:', error);
        // Fallback to sample data if JSON file is not available
        blogData = {
            posts: [
                {
                    id: 1,
                    date: "2025-06-16",
                    title: "サイトの開設",
                    content: "サイトが公開されました。これからもNohackanarchyをよろしくお願いいたします。",
                    author: "orasan",
                    category: "announcement",
                    featured: true
                },
                {
                    id: 2,
                    date: "2025-06-16",
                    title: "サーバールール更新のお知らせ",
                    content: "サーバールールが一部更新されました。以下の行為は引き続き禁止されています：\n\n• ハッキング\n• チートとハッククライアントの使用\n• サーバークラッシャー\n• X-rayの使用\n\n**要約: チート以外なんでもあり！**\n荒らし行為は通常通り許可されています。",
                    author: "admin",
                    category: "important",
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
            if (password !== 'n#C.QTpd}qNthH^03r3i') {
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
    document.getElementById('post-content').value = '';
    document.getElementById('post-author').value = '';
    document.getElementById('post-category').value = 'announcement';
    document.getElementById('post-featured').checked = false;
}

// Edit post
function editPost(id) {
    const post = blogData.posts.find(p => p.id === id);
    if (!post) return;

    document.getElementById('post-id').value = post.id;
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-content').value = post.content;
    document.getElementById('post-author').value = post.author;
    document.getElementById('post-category').value = post.category;
    document.getElementById('post-featured').checked = post.featured;

    document.getElementById('form-title').textContent = '記事を編集';
    document.getElementById('post-form').style.display = 'block';

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
    const id = document.getElementById('post-id').value;
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const author = document.getElementById('post-author').value;
    const category = document.getElementById('post-category').value;
    const featured = document.getElementById('post-featured').checked;

    if (!title || !content || !author) {
        alert('すべての必須項目を入力してください。');
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    if (id) {
        // Edit existing post
        const postIndex = blogData.posts.findIndex(p => p.id == id);
        if (postIndex !== -1) {
            blogData.posts[postIndex] = {
                ...blogData.posts[postIndex],
                title,
                content,
                author,
                category,
                featured
            };
        }
        showNotification('記事が更新されました。');
    } else {
        // Add new post
        const newId = Math.max(...blogData.posts.map(p => p.id)) + 1;
        const newPost = {
            id: newId,
            date: today,
            title,
            content,
            author,
            category,
            featured
        };
        blogData.posts.unshift(newPost);
        showNotification('新しい記事が追加されました。');
    }

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