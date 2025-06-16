// Global variables
let blogData = null;
let currentPosts = [];
let currentPage = 1;
let postsPerPage = 5;
let currentFilter = 'all';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
async function initializeApp() {
    try {
        await loadBlogData();
        initializeNavigation();
        initializeBlogFunctionality();
        initializeAnimations();
        initializeScrollEffects();
        
        // Ensure data is loaded before filtering and rendering
        if (blogData && blogData.posts && Array.isArray(blogData.posts)) {
            currentPosts = [...blogData.posts];
            console.log('currentPosts initialized:', currentPosts.length);
            renderBlogPosts();
        } else {
            console.error('Blog data not properly loaded');
        }
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Load blog data from JSON (GitHub Pages compatible)
async function loadBlogData() {
    try {
        // GitHub Pages では相対パスでJSONを読み込み
        const response = await fetch('./blog-data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validate data structure
        if (!data.posts || !Array.isArray(data.posts) || !data.categories) {
            throw new Error('Invalid blog data structure');
        }
        
        blogData = data;
        currentPosts = [...blogData.posts];
        console.log('Blog data loaded successfully:', blogData.posts.length, 'posts');
        
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
                    content: "GitHub Pagesでブログを更新する方法:\n\n1. リポジトリのblog-data.jsonを編集\n2. 新しい記事を追加\n3. コミット&プッシュで自動反映\n\n**注意:** ブログ記事の更新はGitHub経由で行ってください。",
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
        console.log('Using fallback data:', blogData.posts.length, 'posts');
    }
}

// Initialize navigation
function initializeNavigation() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            if (targetId) {
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Mobile menu toggle (if implemented)
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

// Initialize blog functionality
function initializeBlogFunctionality() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Filter posts
            currentFilter = this.getAttribute('data-filter');
            filterPosts();
        });
    });

    // Search functionality
    const searchInput = document.getElementById('blog-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            filterPosts();
        }, 300));
    }
}

// Filter posts based on category and search term
function filterPosts() {
    if (!blogData || !blogData.posts || !Array.isArray(blogData.posts)) {
        console.error('Blog data not available for filtering');
        return;
    }

    const searchTerm = document.getElementById('blog-search')?.value.toLowerCase() || '';
    
    currentPosts = blogData.posts.filter(post => {
        // Filter by category
        const categoryMatch = currentFilter === 'all' || post.category === currentFilter;
        
        // Filter by search term
        const searchMatch = !searchTerm || 
            (post.title && post.title.toLowerCase().includes(searchTerm)) ||
            (post.content && post.content.toLowerCase().includes(searchTerm)) ||
            (post.author && post.author.toLowerCase().includes(searchTerm));
        
        return categoryMatch && searchMatch;
    });

    console.log('Filtered posts:', currentPosts.length, 'from', blogData.posts.length);

    // Reset to first page when filtering
    currentPage = 1;
    renderBlogPosts();
}

// Render blog posts
function renderBlogPosts() {
    const postsContainer = document.getElementById('blog-posts');
    const paginationContainer = document.getElementById('pagination');
    
    console.log('renderBlogPosts called');
    console.log('postsContainer:', postsContainer);
    console.log('currentPosts:', currentPosts);
    
    if (!postsContainer) {
        console.error('Blog posts container not found');
        return;
    }

    if (!currentPosts || !Array.isArray(currentPosts)) {
        console.error('currentPosts is not available');
        postsContainer.innerHTML = `
            <div class="no-posts">
                <h3>データの読み込みエラー</h3>
                <p>ブログデータが正しく読み込まれませんでした。</p>
            </div>
        `;
        return;
    }

    if (currentPosts.length === 0) {
        console.log('No posts to display');
        postsContainer.innerHTML = `
            <div class="no-posts">
                <h3>記事が見つかりませんでした</h3>
                <p>検索条件を変更してみてください。</p>
            </div>
        `;
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
        return;
    }

    // Calculate pagination
    const totalPosts = currentPosts.length;
    const totalPages = Math.ceil(totalPosts / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToShow = currentPosts.slice(startIndex, endIndex);

    console.log(`Displaying ${postsToShow.length} posts (${startIndex}-${endIndex} of ${totalPosts})`);

    // Generate posts HTML
    const postsHTML = postsToShow.map(post => {
        const category = (blogData && blogData.categories && blogData.categories[post.category]) || { 
            name: post.category || 'Unknown', 
            color: '#5865f2', 
            icon: '📄' 
        };
        const featuredClass = post.featured ? 'featured' : '';
        
        return `
            <article class="blog-post ${featuredClass}" data-id="${post.id}">
                ${post.featured ? '<div class="featured-badge">⭐ 注目</div>' : ''}
                <div class="post-header">
                    <span class="post-category" style="color: ${category.color}">
                        ${category.icon} ${category.name}
                    </span>
                    <span class="post-date">${formatDate(post.date)}</span>
                </div>
                <h3 class="post-title">${escapeHtml(post.title || 'Untitled')}</h3>
                <div class="post-content">${formatContent(post.content || '')}</div>
                <div class="post-footer">
                    <span class="post-author">👤 ${escapeHtml(post.author || 'Unknown')}</span>
                </div>
            </article>
        `;
    }).join('');

    postsContainer.innerHTML = postsHTML;
    console.log('Posts HTML generated and inserted');

    // Generate pagination
    if (paginationContainer && totalPages > 1) {
        let paginationHTML = '<div class="pagination-info">';
        paginationHTML += `${totalPosts}件中 ${startIndex + 1}-${Math.min(endIndex, totalPosts)}件表示`;
        paginationHTML += '</div><div class="pagination-controls">';

        // Previous button
        if (currentPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="changePage(${currentPage - 1})">« 前へ</button>`;
        }

        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === currentPage ? 'active' : '';
            paginationHTML += `<button class="pagination-btn ${activeClass}" onclick="changePage(${i})">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
        }

        // Next button
        if (currentPage < totalPages) {
            paginationHTML += `<button class="pagination-btn" onclick="changePage(${currentPage + 1})">次へ »</button>`;
        }

        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
    } else if (paginationContainer) {
        paginationContainer.innerHTML = '';
    }
}

// Change page
function changePage(page) {
    currentPage = page;
    renderBlogPosts();
    
    // Scroll to top of blog section
    const blogSection = document.getElementById('blog');
    if (blogSection) {
        blogSection.scrollIntoView({
            behavior: 'smooth'
        });
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format content with basic markdown-like formatting
function formatContent(content) {
    if (!content) return '';
    
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/^• (.+)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Debounce function for search
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

// Initialize animations
function initializeAnimations() {
    // Floating animation for hero logo
    const logo = document.querySelector('.hero-title-logo');
    if (logo) {
        logo.style.animation = 'float 3s ease-in-out infinite';
    }

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .server-info-card, .blog-post').forEach(el => {
        observer.observe(el);
    });
}

// Initialize scroll effects
function initializeScrollEffects() {
    let ticking = false;

    function updateScrollEffects() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;

        // Parallax effect for hero background
        const hero = document.querySelector('.hero-section');
        if (hero) {
            hero.style.transform = `translateY(${rate}px)`;
        }

        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick);

    // Header scroll effect
    const header = document.querySelector('.header');
    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            header?.classList.add('header-hidden');
        } else {
            // Scrolling up
            header?.classList.remove('header-hidden');
        }
        
        lastScrollTop = scrollTop;
    });
}