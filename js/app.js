document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupTabs();
});

function initializeApp() {
    setupScrollListener();
    setupRecommendationSystem();
    
    const discoverTab = document.querySelector('[data-tab="discover"]');
    if (discoverTab) {
        discoverTab.classList.add('active');
    }
    
    const discoverTabContent = document.getElementById('discover-tab');
    if (discoverTabContent) {
        discoverTabContent.classList.add('active');
    }
    
    // Check if we need to load initial article
    const existingArticleContainer = document.querySelector('.article-container');
    if (existingArticleContainer && 
        existingArticleContainer.querySelector('#article-title').textContent === 'Article Title' &&
        existingArticleContainer.querySelector('#article-text').textContent === 'Article text will be displayed here...') {
        // Replace placeholder with actual content
        loadArticle();
    } else if (!existingArticleContainer) {
        // No article container exists, create one
        loadArticle();
    } else {
        console.log('Article already loaded');
    }
}

// Article buffer to store preloaded articles
const articleBuffer = [];
const BUFFER_SIZE = 10;
let isLoadingBuffer = false;

// Add these variables at the top of your file
let articleStartTime = null;
let currentArticleId = null;
let currentArticleData = null;

// Add these variables to keep track of the visible articles
let visibleArticles = [];
const MAX_VISIBLE_ARTICLES = 5; // Maximum number of articles to keep in DOM

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

function getNextArticle() {
    if (articleBuffer.length > 0) {
        const nextArticle = articleBuffer.shift();
        
        if (articleBuffer.length < BUFFER_SIZE/2) {
            fillArticleBuffer();
        }
        
        return {
            element: nextArticle.element,
            data: nextArticle.data
        };
    } else {
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
        
        // Also recycle any off-screen articles
        recycleArticleViews();
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

// Replace the current addArticleWithTransition function with this version
function addArticleWithTransition(articleElement) {
    // Determine which tab is active
    const activeTab = document.querySelector('.tab-content.active');
    
    // Get main container within the active tab or create if doesn't exist
    let mainContainer = activeTab.querySelector('.main-scroll-container');
    if (!mainContainer) {
        mainContainer = document.createElement('div');
        mainContainer.className = 'main-scroll-container';
        activeTab.appendChild(mainContainer);
        
        // Add scroll event listener for recycling views
        mainContainer.addEventListener('scroll', handleScrollForRecycling);
    }
    
    // Add the new article
    articleElement.style.transform = 'translateY(100%)';
    articleElement.style.opacity = '0';
    mainContainer.appendChild(articleElement);
    
    // Add to visible articles array
    visibleArticles.push({
        element: articleElement,
        id: Math.random().toString(36).substr(2, 9) // Generate unique ID
    });
    
    // Clean up old articles if we have too many
    recycleArticleViews();
    
    // Trigger animation
    setTimeout(() => {
        articleElement.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
        articleElement.style.transform = 'translateY(0)';
        articleElement.style.opacity = '1';
    }, 10);
}

// Add the recycling function
function recycleArticleViews() {
    if (visibleArticles.length <= MAX_VISIBLE_ARTICLES) return;
    
    // Get the current scroll position
    const activeTab = document.querySelector('.tab-content.active');
    const mainContainer = activeTab?.querySelector('.main-scroll-container');
    if (!mainContainer) return;
    
    // Sort articles by their position in the DOM
    visibleArticles.sort((a, b) => {
        const posA = a.element.getBoundingClientRect().top;
        const posB = b.element.getBoundingClientRect().top;
        return posA - posB;
    });
    
    // Find which articles are off-screen and can be removed
    const viewportHeight = window.innerHeight;
    const articlesToRemove = [];
    
    // Keep a minimum number of articles before and after the visible area
    const bufferCount = 1; // Keep 1 article before and after visible area
    
    // Find articles that are far off-screen (beyond our buffer)
    for (let i = 0; i < visibleArticles.length - bufferCount; i++) {
        const article = visibleArticles[i];
        const rect = article.element.getBoundingClientRect();
        
        // If it's far above the viewport, mark for removal
        if (rect.bottom < -viewportHeight) {
            articlesToRemove.push(article);
        }
    }
    
    // Also check articles that are far below
    for (let i = bufferCount + 1; i < visibleArticles.length; i++) {
        const article = visibleArticles[i];
        const rect = article.element.getBoundingClientRect();
        
        // If it's far below the viewport, mark for removal
        if (rect.top > viewportHeight * 2) {
            articlesToRemove.push(article);
        }
    }
    
    // Remove the off-screen articles
    articlesToRemove.forEach(article => {
        // Remove from DOM
        if (article.element.parentNode) {
            article.element.parentNode.removeChild(article.element);
        }
        
        // Remove from our tracking array
        const index = visibleArticles.findIndex(a => a.id === article.id);
        if (index !== -1) {
            visibleArticles.splice(index, 1);
        }
    });
    
    console.log(`Recycled ${articlesToRemove.length} articles. Current count: ${visibleArticles.length}`);
}

// Add a scroll handler for recycling views
function handleScrollForRecycling() {
    // Debounce for better performance
    clearTimeout(window.recycleTimer);
    window.recycleTimer = setTimeout(() => {
        recycleArticleViews();
    }, 100);
}

// Update addArticleWithTransition to handle the current tab context
function addArticleWithTransition(articleElement) {
    // Determine which tab is active
    const activeTab = document.querySelector('.tab-content.active');
    
    // Get main container within the active tab or create if doesn't exist
    let mainContainer = activeTab.querySelector('.main-scroll-container');
    if (!mainContainer) {
        mainContainer = document.createElement('div');
        mainContainer.className = 'main-scroll-container';
        activeTab.appendChild(mainContainer);
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
                    // Left swipe - next article and mark as skipped
                    console.log("Swiped left - next article");
                    if (currentActiveArticle) {
                        const title = currentActiveArticle.querySelector('#article-title').textContent;
                        handleSkip(title);
                    }
                    fetchRandomArticleData();
                }
            }
        } else {
            // Vertical swipe
            if (deltaY < -50) {
                // Swipe up - load next article
                updateCategoryPreference(currentArticleId, 0.25); // Basic interest
                fetchRandomArticleData();
            }
        }
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
        
        // Update category preference with maximum weight
        updateCategoryPreference(title, 1.0);
        
        // Save to liked articles in localStorage
        const likedArticles = JSON.parse(localStorage.getItem('likedArticles')) || [];
        
        // Find article data in history
        const history = JSON.parse(localStorage.getItem('articleHistory')) || [];
        const articleData = history.find(item => item.title === title) || { 
            title,
            timestamp: Date.now() 
        };
        
        likedArticles.push(articleData);
        localStorage.setItem('likedArticles', JSON.stringify(likedArticles));
    }
    
    function handleSkip(title) {
        if (!title) return;
        
        console.log(`Skipped article: "${title}"`);
        updateCategoryPreference(title, 0.0);
        
        // Save to skipped articles in localStorage
        const skippedArticles = JSON.parse(localStorage.getItem('skippedArticles')) || [];
        skippedArticles.push({
            title,
            timestamp: Date.now()
        });
        localStorage.setItem('skippedArticles', JSON.stringify(skippedArticles));
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
    // Initialize tracking for the first article
    startArticleTracking();
    
    // Listen for visibility changes (app in background/foreground)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Apply category decay once per day
    const lastDecayTime = localStorage.getItem('lastCategoryDecay');
    const now = Date.now();
    if (!lastDecayTime || (now - parseInt(lastDecayTime)) > 24 * 60 * 60 * 1000) {
        applyCategoryDecay();
        localStorage.setItem('lastCategoryDecay', now.toString());
    }
}

function startArticleTracking() {
    const currentArticle = findCurrentVisibleArticle();
    if (currentArticle) {
        const title = currentArticle.querySelector('#article-title').textContent;
        articleStartTime = Date.now();
        currentArticleId = title; // Using title as ID
        
        // Find the article data from history
        const history = JSON.parse(localStorage.getItem('articleHistory')) || [];
        currentArticleData = history.find(item => item.title === title);
    }
}

function handleVisibilityChange() {
    if (document.hidden) {
        // App went to background, record time spent
        recordTimeSpent();
    } else {
        // App came to foreground, start tracking again
        startArticleTracking();
    }
}

function recordTimeSpent() {
    if (!articleStartTime || !currentArticleId) return;
    
    const timeSpent = (Date.now() - articleStartTime) / 1000; // Convert to seconds
    console.log(`Time spent on "${currentArticleId}": ${timeSpent} seconds`);
    
    if (timeSpent > 30) { // More than 30 seconds indicates interest
        updateCategoryPreference(currentArticleId, 0.75, timeSpent);
    } else if (timeSpent > 5) { // At least some engagement
        updateCategoryPreference(currentArticleId, 0.25, timeSpent);
    }
    
    // Reset tracking
    articleStartTime = null;
}

function updateCategoryPreference(articleTitle, weight, timeSpent = 0) {
    // Get article from history
    const history = JSON.parse(localStorage.getItem('articleHistory')) || [];
    const article = history.find(item => item.title === articleTitle);
    
    if (!article) return;
    
    // Extract categories for this article
    const categories = extractCategories(article);
    
    // Get existing preferences
    const preferences = JSON.parse(localStorage.getItem('categoryPreferences')) || {};
    
    // Update preferences for each category
    categories.forEach(category => {
        if (!preferences[category]) {
            preferences[category] = {
                weight: 0,
                count: 0,
                timeSpent: 0,
                lastUpdated: Date.now()
            };
        }
        
        // Update with new weight (weighted average)
        const current = preferences[category];
        current.count++;
        current.timeSpent += timeSpent;
        current.lastUpdated = Date.now();
        
        // Exponential moving average to favor recent interactions
        const alpha = 0.3; // Learning rate
        current.weight = (current.weight * (1 - alpha)) + (weight * alpha);
    });
    
    // Save updated preferences
    localStorage.setItem('categoryPreferences', JSON.stringify(preferences));
    
    // Log current preferences for debugging
    console.log('Updated category preferences:', 
        Object.entries(preferences)
            .sort((a, b) => b[1].weight - a[1].weight)
            .slice(0, 5)
            .map(([category, data]) => `${category}: ${data.weight.toFixed(2)}`)
    );
}

function extractCategories(article) {
    if (!article || !article.title) return [];
    
    const categories = [];
    
    // Simple keyword extraction from title
    const titleWords = article.title.toLowerCase().split(/\W+/).filter(word => 
        word.length > 3 && !["this", "that", "with", "from", "about", "what", "when", "where", "which", "how"].includes(word)
    );
    
    // Extract words from content
    const contentWords = article.extract ? 
        article.extract.toLowerCase().split(/\W+/).filter(word => 
            word.length > 4 && !["this", "that", "with", "from", "about", "what", "when", "where", "which", "how"].includes(word)
        ) : [];
    
    // Count occurrences
    const wordCounts = {};
    [...titleWords, ...contentWords].forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    // Find top keywords
    const topKeywords = Object.keys(wordCounts)
        .sort((a, b) => wordCounts[b] - wordCounts[a])
        .slice(0, 5); // Take top 5 keywords
    
    return topKeywords;
}

function applyCategoryDecay() {
    const preferences = JSON.parse(localStorage.getItem('categoryPreferences')) || {};
    const now = Date.now();
    const decayRate = 0.05; // 5% decay per day
    
    Object.keys(preferences).forEach(category => {
        const lastUpdated = preferences[category].lastUpdated || now;
        const daysSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUpdate > 1) {
            // Apply decay based on days since last update
            preferences[category].weight *= Math.pow(1 - decayRate, daysSinceUpdate);
            preferences[category].lastUpdated = now;
        }
    });
    
    localStorage.setItem('categoryPreferences', JSON.stringify(preferences));
    console.log('Applied category decay to preferences');
}

function saveToHistory(articleData) {
    // Get existing history or initialize empty array
    let history = JSON.parse(localStorage.getItem('articleHistory')) || [];
    
    // Add current article to history with more data for categorization
    history.push({
        title: articleData.title,
        extract: articleData.extract,
        extract_html: articleData.extract_html,
        thumbnail: articleData.thumbnail ? articleData.thumbnail.source : null,
        pageid: articleData.pageid,
        content_urls: articleData.content_urls,
        timestamp: Date.now()
    });
    
    // Keep only the last 50 articles
    if (history.length > 50) {
        history = history.slice(-50);
    }
    
    // Save back to localStorage
    localStorage.setItem('articleHistory', JSON.stringify(history));
    
    // Set current article data for tracking
    currentArticleId = articleData.title;
    currentArticleData = history[history.length - 1];
    articleStartTime = Date.now();
}

function loadRecommendations() {
    const preferences = JSON.parse(localStorage.getItem('categoryPreferences')) || {};
    
    // Get top categories based on weight
    const topCategories = Object.keys(preferences)
        .sort((a, b) => preferences[b].weight - preferences[a].weight)
        .slice(0, 10); // Top 10 categories
    
    console.log("User's top categories:", topCategories);
    
    // Use these categories for future article loading
    // Since we're using random Wikipedia articles, we'll need to
    // score them after fetching to check if they match preferences
    
    return topCategories;
}

function scoreArticleRelevance(article) {
    if (!article) return 0;
    
    const categories = extractCategories(article);
    const preferences = JSON.parse(localStorage.getItem('categoryPreferences')) || {};
    
    let relevanceScore = 0;
    let matchCount = 0;
    
    categories.forEach(category => {
        if (preferences[category]) {
            relevanceScore += preferences[category].weight;
            matchCount++;
        }
    });
    
    // Normalize score if we found matches
    if (matchCount > 0) {
        relevanceScore = relevanceScore / matchCount;
    }
    
    return relevanceScore;
}

// Update setupTabs to ensure proper tab handling
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default behavior
            
            // Get tab name
            const tabName = button.getAttribute('data-tab');
            console.log(`Switching to tab: ${tabName}`);
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabContent = document.getElementById(`${tabName}-tab`);
            if (tabContent) {
                tabContent.classList.add('active');
                
                // Clear and reload content based on tab
                if (tabName === 'for-you') {
                    // Don't clear discover tab when switching to For You
                    // Just load the For You content
                    loadRecommendationsTab();
                } else if (tabName === 'discover') {
                    // Only clear if the discover tab is empty
                    const discoverContainer = tabContent.querySelector('.main-scroll-container');
                    if (!discoverContainer || !discoverContainer.querySelector('.article-container')) {
                        clearDiscoverTabContent();
                        loadFreshDiscoverContent();
                    }
                }
            } else {
                console.error(`Tab content not found: ${tabName}-tab`);
            }
        });
    });
}

// Clear articles when switching tabs
function clearDiscoverTabContent() {
    const discoverTab = document.getElementById('discover-tab');
    const mainContainer = discoverTab.querySelector('.main-scroll-container');
    
    if (mainContainer) {
        // Remove the main container with all article elements
        mainContainer.remove();
        
        // Create a new empty main container
        const newMainContainer = document.createElement('div');
        newMainContainer.className = 'main-scroll-container';
        discoverTab.appendChild(newMainContainer);
        
        // Clear visible articles tracking
        visibleArticles = [];
        
        // Add scroll event listener
        newMainContainer.addEventListener('scroll', handleScrollForRecycling);
    } else {
        // If no container exists, create one
        const newMainContainer = document.createElement('div');
        newMainContainer.className = 'main-scroll-container';
        discoverTab.appendChild(newMainContainer);
        
        // Add scroll event listener
        newMainContainer.addEventListener('scroll', handleScrollForRecycling);
    }
}

// Update this function to properly load content when switching back to Discover tab
function loadFreshDiscoverContent() {
    // Reset tracking variables
    articleStartTime = null;
    currentArticleId = null;
    currentArticleData = null;
    
    // Get the discover tab
    const discoverTab = document.getElementById('discover-tab');
    
    // Make sure the tab is empty or has the main container ready
    if (!discoverTab.querySelector('.main-scroll-container')) {
        const mainContainer = document.createElement('div');
        mainContainer.className = 'main-scroll-container';
        discoverTab.appendChild(mainContainer);
    }
    
    // Fetch and load a new article
    fetchRandomArticleData();
    
    // Start tracking for the recommendation system
    setTimeout(() => {
        startArticleTracking();
    }, 500);
}

// Updated loadRecommendationsTab function that uses vertical scrolling format
function loadRecommendationsTab() {
    // Create a new container for the For You tab content with vertical scrolling
    const forYouTab = document.getElementById('for-you-tab');
    forYouTab.innerHTML = ''; // Clear any existing content
    
    // Create a main scroll container like in the discover tab
    const forYouScrollContainer = document.createElement('div');
    forYouScrollContainer.className = 'main-scroll-container';
    forYouTab.appendChild(forYouScrollContainer);
    
    // Show loading indicator
    const loadingIndicator = showLoadingIndicator();
    
    // Get user's preferences
    const preferences = JSON.parse(localStorage.getItem('categoryPreferences')) || {};
    
    // If no preferences yet, show an onboarding message
    if (Object.keys(preferences).length < 3) {
        hideLoadingIndicator(loadingIndicator);
        
        const onboardingArticle = document.createElement('div');
        onboardingArticle.className = 'article-container';
        onboardingArticle.innerHTML = `
            <div class="glass-div" style="top: 0; border-radius: 0;">
                <h1 id="article-title">Welcome to For You</h1>
                <p id="article-text">
                    Read more articles in the Discover tab to get personalized recommendations.
                    <br><br>
                    Double-tap to like articles you enjoy, and we'll find more content that matches your interests.
                </p>
                <button class="load-more-button" id="go-discover-button">Start Discovering</button>
            </div>
        `;
        
        forYouScrollContainer.appendChild(onboardingArticle);
        
        // Add button click handler
        document.getElementById('go-discover-button').addEventListener('click', () => {
            document.querySelector('[data-tab="discover"]').click();
        });
        
        return;
    }
    
    // Get top categories based on weight
    const topCategories = Object.keys(preferences)
        .sort((a, b) => preferences[b].weight - preferences[a].weight)
        .slice(0, 5); // Top 5 categories
    
    console.log("Fetching articles for top categories:", topCategories);
    
    // Use these top categories to fetch related articles from Wikipedia
    fetchArticlesForCategories(topCategories)
        .then(articles => {
            hideLoadingIndicator(loadingIndicator);
            
            if (articles.length === 0) {
                const noResultsArticle = document.createElement('div');
                noResultsArticle.className = 'article-container';
                noResultsArticle.innerHTML = `
                    <div class="glass-div" style="top: 0; border-radius: 0;">
                        <h1 id="article-title">No Recommendations Yet</h1>
                        <p id="article-text">
                            We're having trouble finding articles that match your interests.
                            <br><br>
                            Try reading more articles in the Discover tab to improve your recommendations.
                        </p>
                        <button class="load-more-button" id="try-discover-button">Go to Discover</button>
                    </div>
                `;
                
                forYouScrollContainer.appendChild(noResultsArticle);
                
                // Add button click handler
                document.getElementById('try-discover-button').addEventListener('click', () => {
                    document.querySelector('[data-tab="discover"]').click();
                });
                
                return;
            }
            
            // For each article, create and add it to the container
            articles.forEach(articleData => {
                const articleElement = createNewArticleElement(articleData);
                
                // Add custom class to indicate it's a recommendation
                articleElement.classList.add('recommendation-article');
                
                // Add relevance indicator
                const relevanceScore = Math.round(articleData.relevanceScore * 100);
                const relevanceIndicator = document.createElement('div');
                relevanceIndicator.className = 'relevance-indicator';
                relevanceIndicator.textContent = `${relevanceScore}% Match`;
                articleElement.appendChild(relevanceIndicator);
                
                // Add it to the DOM
                forYouScrollContainer.appendChild(articleElement);
            });
            
            // Add a "Load More" button at the bottom
            const loadMoreContainer = document.createElement('div');
            loadMoreContainer.className = 'article-container load-more-container';
            loadMoreContainer.style.height = 'auto';
            loadMoreContainer.style.minHeight = '150px';
            loadMoreContainer.innerHTML = `
                <div class="glass-div" style="display: flex; justify-content: center; align-items: center; top: 0; border-radius: 0;">
                    <button class="load-more-button" id="load-more-recommendations">Load More Recommendations</button>
                </div>
            `;
            
            forYouScrollContainer.appendChild(loadMoreContainer);
            
            // Add button click handler
            document.getElementById('load-more-recommendations').addEventListener('click', function() {
                this.textContent = 'Loading...';
                this.disabled = true;
                
                fetchMoreForYouArticles(topCategories)
                    .then(newArticles => {
                        // Remove the load more button container
                        loadMoreContainer.remove();
                        
                        // Add new articles
                        newArticles.forEach(articleData => {
                            const articleElement = createNewArticleElement(articleData);
                            articleElement.classList.add('recommendation-article');
                            
                            const relevanceScore = Math.round(articleData.relevanceScore * 100);
                            const relevanceIndicator = document.createElement('div');
                            relevanceIndicator.className = 'relevance-indicator';
                            relevanceIndicator.textContent = `${relevanceScore}% Match`;
                            articleElement.appendChild(relevanceIndicator);
                            
                            forYouScrollContainer.appendChild(articleElement);
                        });
                        
                        // Add the load more button back at the end
                        forYouScrollContainer.appendChild(loadMoreContainer);
                        
                        // Reset button state
                        this.textContent = 'Load More Recommendations';
                        this.disabled = false;
                    })
                    .catch(error => {
                        console.error('Error loading more recommendations:', error);
                        this.textContent = 'Try Again';
                        this.disabled = false;
                    });
            });
        })
        .catch(error => {
            console.error('Error loading recommendations tab:', error);
            hideLoadingIndicator(loadingIndicator);
            
            const errorElement = document.createElement('div');
            errorElement.className = 'article-container';
            errorElement.innerHTML = `
                <div class="glass-div" style="top: 0; border-radius: 0;">
                    <h1 id="article-title">Error Loading Recommendations</h1>
                    <p id="article-text">
                        Sorry, we couldn't load your personalized recommendations.
                        <br><br>
                        Please try again later.
                    </p>
                    <button class="load-more-button" id="retry-recommendations">Try Again</button>
                </div>
            `;
            
            forYouScrollContainer.appendChild(errorElement);
            
            // Add button click handler
            document.getElementById('retry-recommendations').addEventListener('click', () => {
                loadRecommendationsTab();
            });
        });
}

// Function to fetch articles based on user's top categories
async function fetchArticlesForCategories(categories) {
    if (!categories || categories.length === 0) {
        return [];
    }
    
    // First try to get cached articles that match the categories
    const cachedArticles = getCachedArticlesForCategories(categories);
    if (cachedArticles.length > 5) {
        // If we have enough cached articles, use those
        console.log("Using cached articles for recommendations");
        return cachedArticles;
    }
    
    console.log("Fetching fresh articles for recommendations");
    
    // Otherwise fetch new articles from Wikipedia based on categories
    const articles = [];
    const fetchedCount = Math.min(10, 20 - cachedArticles.length); // Fetch enough to get a good set
    
    try {
        // Fetch multiple random articles
        for (let i = 0; i < fetchedCount; i++) {
            const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
            const data = await response.json();
            
            // Score the article for relevance to user's categories
            const relevanceScore = scoreArticleRelevance(data);
            
            // Add relevance score to the article data
            data.relevanceScore = relevanceScore;
            
            // Save to history for future recommendation
            saveToHistory(data);
            
            // Add to our results array
            articles.push(data);
            
            // Small delay to avoid rate limiting
            if (i < fetchedCount - 1) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        
        // Sort by relevance score (highest first)
        articles.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        // Return top articles plus any cached articles
        return [...articles, ...cachedArticles].slice(0, 10);
    } catch (error) {
        console.error('Error fetching category-based articles:', error);
        
        // If we have any cached articles, return those instead
        if (cachedArticles.length > 0) {
            return cachedArticles;
        }
        
        // Otherwise return an empty array
        return [];
    }
}

// Get cached articles that match the user's categories
function getCachedArticlesForCategories(categories) {
    const history = JSON.parse(localStorage.getItem('articleHistory')) || [];
    
    // Skip articles that the user has already seen recently (within the last day)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentArticles = new Set(
        history
            .filter(a => a.timestamp > oneDayAgo)
            .map(a => a.title)
    );
    
    // Score all articles in history by relevance
    const scoredArticles = history
        .filter(a => !recentArticles.has(a.title)) // Filter out recently viewed articles
        .map(article => {
            const relevanceScore = scoreArticleRelevance(article);
            return {
                ...article,
                relevanceScore
            };
        })
        .filter(article => article.relevanceScore > 0.4) // Only include articles with decent relevance
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return scoredArticles.slice(0, 5);
}

// Fetch more articles for the For You tab
async function fetchMoreForYouArticles(categories) {
    const articles = [];
    
    try {
        // Fetch multiple random articles
        for (let i = 0; i < 10; i++) {
            const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
            const data = await response.json();
            
            // Score the article for relevance to user's categories
            const relevanceScore = scoreArticleRelevance(data);
            
            // Add relevance score to the article data
            data.relevanceScore = relevanceScore;
            
            // Save to history for future recommendation
            saveToHistory(data);
            
            // Add to our results array
            articles.push(data);
            
            // Small delay to avoid rate limiting
            if (i < 9) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        
        // Sort by relevance score (highest first)
        articles.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        return articles.slice(0, 5); // Return the top 5 most relevant articles
    } catch (error) {
        console.error('Error fetching more articles for For You tab:', error);
        return [];
    }
}

// Move findCurrentVisibleArticle out of setupScrollListener to make it globally accessible
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