document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    const existingArticleContainer = document.querySelector('.article-container');
    
    if (existingArticleContainer && 
        document.getElementById('article-title').textContent === 'Article Title' &&
        document.getElementById('article-text').textContent === 'Article text will be displayed here...') {
        loadArticle();
    } else if (!existingArticleContainer) {
        loadArticle();
    } else {
        console.log('Article already loaded');
    }
    
    setupScrollListener();
    setupRecommendationSystem();
}

// Article buffer to store preloaded articles
const articleBuffer = [];
const BUFFER_SIZE = 10;
let isLoadingBuffer = false;

function loadArticle() {
    // Remove existing empty container if it exists
    const existingContainer = document.querySelector('.article-container');
    if (existingContainer &&
        document.getElementById('article-title').textContent === 'Article Title' &&
        document.getElementById('article-text').textContent === 'Article text will be displayed here...') {
        existingContainer.remove();
    }
    
    // Now fetch and create a new article
    fetchRandomArticleData();

    fillArticleBuffer();
}

async function fillArticleBuffer() {
    if (isLoadingBuffer) return;
    
    isLoadingBuffer = true;
    
    while (articleBuffer.length < BUFFER_SIZE) {
        try {
            // Fetch article data without showing loading indicator
            const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
            const data = await response.json();
            
            // Create article element and add to buffer
            const newArticle = createNewArticleElement(data);
            articleBuffer.push({
                element: newArticle,
                data: data
            });
            
            console.log(`Preloaded article: "${data.title}". Buffer size: ${articleBuffer.length}/${BUFFER_SIZE}`);
        } catch (error) {
            console.error('Error preloading article for buffer:', error);
            // Don't retry immediately if there's an error
            break;
        }
    }
    
    isLoadingBuffer = false;
}

// Use an article from buffer or fetch new one if buffer is empty
function getNextArticle() {
    // If buffer has articles, use one
    if (articleBuffer.length > 0) {
        const nextArticle = articleBuffer.shift();
        
        // Trigger refill of buffer when it gets low
        if (articleBuffer.length < BUFFER_SIZE/2) {
            fillArticleBuffer();
        }
        
        return {
            element: nextArticle.element,
            data: nextArticle.data
        };
    } else {
        // Buffer is empty, need to fetch directly
        return null;
    }
}

// Fetch a random article from Wikipedia
async function fetchRandomArticleData() {
    try {
        const loadingIndicator = showLoadingIndicator();
        
        // Try to get article from buffer first
        const bufferArticle = getNextArticle();
        
        if (bufferArticle) {
            // We have a preloaded article, use it
            addArticleWithTransition(bufferArticle.element);
            hideLoadingIndicator(loadingIndicator);
            saveToHistory(bufferArticle.data);
        } else {
            // No preloaded article available, fetch directly
            const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
            const data = await response.json();
            
            // Create a new article container
            const newArticle = createNewArticleElement(data);
            
            // Add it to the DOM with a transition
            addArticleWithTransition(newArticle);
            
            // Save to history for recommendation
            saveToHistory(data);
        }
        
        // Hide loading indicator
        hideLoadingIndicator(loadingIndicator);
    } catch (error) {
        console.error('Error fetching Wikipedia article:', error);
        const errorArticle = createErrorArticleElement();
        addArticleWithTransition(errorArticle);
    }
}

function showLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loadingDiv);
    return loadingDiv;
}

function hideLoadingIndicator(loadingDiv) {
    if (loadingDiv && loadingDiv.parentNode) {
        loadingDiv.parentNode.removeChild(loadingDiv);
    }
}

function createNewArticleElement(data) {
    const articleContainer = document.createElement('div');
    articleContainer.className = 'article-container';
    
    // Create image element
    const imgElement = document.createElement('img');
    imgElement.id = 'article-image';
    imgElement.alt = data.title;
    
    // Set image if available
    if (data.thumbnail && data.thumbnail.source) {
        imgElement.src = data.thumbnail.source;
    } else {
        // Use a placeholder image
        imgElement.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/200px-Wikipedia-logo-v2.svg.png';
    }
    
    // Create glass div
    const glassDiv = document.createElement('div');
    glassDiv.className = 'glass-div';
    
    // Add title
    const titleElement = document.createElement('h1');
    titleElement.id = 'article-title';
    titleElement.textContent = data.title;
    
    // Add text
    const textElement = document.createElement('p');
    textElement.id = 'article-text';
    textElement.innerHTML = data.extract_html || data.extract;
    
    // Add read more link
    const readMoreLink = document.createElement('a');
    readMoreLink.href = data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`;
    readMoreLink.target = '_blank';
    readMoreLink.textContent = 'Read full article on Wikipedia';
    readMoreLink.className = 'read-more';
    
    // Assemble the elements
    glassDiv.appendChild(titleElement);
    glassDiv.appendChild(textElement);
    glassDiv.appendChild(readMoreLink);
    
    articleContainer.appendChild(imgElement);
    articleContainer.appendChild(glassDiv);
    
    return articleContainer;
}

function createErrorArticleElement() {
    const articleContainer = document.createElement('div');
    articleContainer.className = 'article-container';
    
    const imgElement = document.createElement('img');
    imgElement.id = 'article-image';
    imgElement.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/200px-Wikipedia-logo-v2.svg.png';
    imgElement.alt = 'Error';
    
    const glassDiv = document.createElement('div');
    glassDiv.className = 'glass-div';
    
    const titleElement = document.createElement('h1');
    titleElement.id = 'article-title';
    titleElement.textContent = 'Error loading article';
    
    const textElement = document.createElement('p');
    textElement.id = 'article-text';
    textElement.textContent = 'Please try again later.';
    
    glassDiv.appendChild(titleElement);
    glassDiv.appendChild(textElement);
    
    articleContainer.appendChild(imgElement);
    articleContainer.appendChild(glassDiv);
    
    return articleContainer;
}

function addArticleWithTransition(articleElement) {
    // Get main container or create if doesn't exist
    let mainContainer = document.querySelector('.main-scroll-container');
    if (!mainContainer) {
        mainContainer = document.createElement('div');
        mainContainer.className = 'main-scroll-container';
        document.body.appendChild(mainContainer);
    }
    
    // Add the new article
    articleElement.style.transform = 'translateY(100%)';
    articleElement.style.opacity = '0';
    mainContainer.appendChild(articleElement);
    
    // Trigger animation
    setTimeout(() => {
        articleElement.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
        articleElement.style.transform = 'translateY(0)';
        articleElement.style.opacity = '1';
    }, 10);
}

function setupScrollListener() {
    // Detect when user has scrolled to bottom of current article
    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
            // Load a new article when near bottom
            fetchRandomArticleData();
        }
    });
    
    // Variables for swipe handling
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let currentActiveArticle = null;
    let swipeReactionElement = null;
    
    // Variables for double tap detection
    let lastTapTime = 0;
    let tapTimeout;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        currentActiveArticle = findCurrentVisibleArticle();
        
        // Create reaction element if needed
        if (!swipeReactionElement) {
            swipeReactionElement = document.createElement('div');
            swipeReactionElement.className = 'swipe-reaction';
            document.body.appendChild(swipeReactionElement);
        }
    }, false);
    
    document.addEventListener('touchmove', (e) => {
        if (!currentActiveArticle) return;
        
        touchEndX = e.changedTouches[0].screenX;
        const deltaX = touchEndX - touchStartX;
        
        // Only handle horizontal swipes that are significant
        if (Math.abs(deltaX) < 30) {
            if (swipeReactionElement) {
                swipeReactionElement.style.opacity = '0';
            }
            return;
        }
        
        // Calculate swipe percentage (max out at 50% of screen width for full effect)
        const screenWidth = window.innerWidth;
        const swipePercentage = Math.min(Math.abs(deltaX) / (screenWidth * 0.5), 1);
        
        // Right swipe to move to previous article
        if (deltaX > 0) {
            // You can implement previous article navigation here if needed
            swipeReactionElement.innerHTML = '⬅️';
            swipeReactionElement.className = 'swipe-reaction swipe-previous';
        } else {
            // Left swipe to move to next article
            swipeReactionElement.innerHTML = '➡️';
            swipeReactionElement.className = 'swipe-reaction swipe-next';
        }
        
        // Show and grow the reaction based on swipe distance
        swipeReactionElement.style.opacity = `${swipePercentage}`;
        swipeReactionElement.style.transform = `scale(${0.5 + swipePercentage})`;
        
        // Position the reaction in the center of the screen
        swipeReactionElement.style.display = 'flex';
    }, false);
    
    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        
        // Handle swipe actions
        handleSwipe();
        
        // Reset tracking variables
        currentActiveArticle = null;
        
        // Animate reaction disappearing
        if (swipeReactionElement) {
            swipeReactionElement.style.transform = 'scale(1.5)';
            swipeReactionElement.style.opacity = '0';
            setTimeout(() => {
                swipeReactionElement.style.display = 'none';
            }, 300);
        }
    }, false);
    
    // Handle double tap for like
    document.addEventListener('click', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        
        clearTimeout(tapTimeout);
        
        if (tapLength < 500 && tapLength > 0) {
            // Double tap detected
            const article = findArticleFromEvent(e);
            if (article) {
                handleLike(article);
                showHeartAnimation(e.clientX, e.clientY);
            }
        } else {
            // This is a single tap
            tapTimeout = setTimeout(() => {
                // Single tap handling if needed
            }, 500);
        }
        
        lastTapTime = currentTime;
    });
    
    function handleSwipe() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Detect dominant direction (horizontal or vertical)
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > 100) { // Minimum threshold to detect a deliberate swipe
                if (deltaX > 0) {
                    // Right swipe - previous article or other action
                    console.log("Swiped right - previous article");
                    // You can implement previous article navigation here
                } else {
                    // Left swipe - next article
                    console.log("Swiped left - next article");
                    fetchRandomArticleData();
                }
            }
        } else {
            // Vertical swipe
            if (deltaY < -50) {
                // Swipe up - load next article
                fetchRandomArticleData();
            }
        }
    }
    
    function findCurrentVisibleArticle() {
        // Find the article that's most visible on screen
        const articles = document.querySelectorAll('.article-container');
        
        if (!articles.length) return null;
        
        const viewportHeight = window.innerHeight;
        
        for (const article of articles) {
            const rect = article.getBoundingClientRect();
            // If article is mostly visible in the viewport
            if (rect.top >= -viewportHeight/3 && rect.bottom <= viewportHeight*4/3) {
                return article;
            }
        }
        
        // Default to the first article if none are properly visible
        return articles[0];
    }
    
    function findArticleFromEvent(e) {
        // Find the article element from a click/tap event
        let element = e.target;
        
        while (element && !element.classList.contains('article-container')) {
            element = element.parentElement;
        }
        
        return element;
    }
    
    function handleLike(article) {
        if (!article) return;
        
        const title = article.querySelector('#article-title').textContent;
        console.log(`Liked article: "${title}"`);
        
        // Save to liked articles in localStorage
        const likedArticles = JSON.parse(localStorage.getItem('likedArticles')) || [];
        const articleData = {
            title,
            timestamp: Date.now()
        };
        
        likedArticles.push(articleData);
        localStorage.setItem('likedArticles', JSON.stringify(likedArticles));
    }
    
    function showHeartAnimation(x, y) {
        // Create heart element
        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
        heart.className = 'heart-animation';
        heart.style.left = `${x}px`;
        heart.style.top = `${y}px`;
        
        document.body.appendChild(heart);
        
        // Animate the heart
        setTimeout(() => {
            heart.style.transform = 'translateY(-100px) scale(1.5)';
            heart.style.opacity = '0';
        }, 50);
        
        // Remove after animation completes
        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, 1000);
    }
}

function setupRecommendationSystem() {
    // Initialize the local recommendation system
    loadRecommendations();
}

function saveToHistory(articleData) {
    // Get existing history or initialize empty array
    let history = JSON.parse(localStorage.getItem('articleHistory')) || [];
    
    // Add current article to history
    history.push({
        title: articleData.title,
        extract: articleData.extract,
        thumbnail: articleData.thumbnail ? articleData.thumbnail.source : null,
        pageid: articleData.pageid,
        timestamp: Date.now()
    });
    
    // Keep only the last 50 articles
    if (history.length > 50) {
        history = history.slice(-50);
    }
    
    // Save back to localStorage
    localStorage.setItem('articleHistory', JSON.stringify(history));
}

function loadRecommendations() {
    // Implementation depends on how you want to show recommendations
    // This could be populated from the articleHistory in localStorage
    const history = JSON.parse(localStorage.getItem('articleHistory')) || [];
    
    // Simple implementation: just suggest previously visited articles
    if (history.length > 0) {
        console.log('Recommendations loaded from history:', history.length, 'items');
    }
}