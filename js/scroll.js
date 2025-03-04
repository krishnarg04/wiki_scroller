// This file manages the vertical scrolling behavior of the application. 
// It includes functions to handle scroll events and update the display of articles as the user scrolls.

// Change this line to match your HTML structure
const scrollContainer = document.querySelector('.article-container');
const articles = document.querySelectorAll('.article');
let currentArticleIndex = 0;

function handleScroll(event) {
    const delta = Math.sign(event.deltaY);
    if (delta > 0) {
        scrollToNextArticle();
    } else {
        scrollToPreviousArticle();
    }
}

function scrollToNextArticle() {
    if (currentArticleIndex < articles.length - 1) {
        currentArticleIndex++;
        updateScrollPosition();
    }
}

function scrollToPreviousArticle() {
    if (currentArticleIndex > 0) {
        currentArticleIndex--;
        updateScrollPosition();
    }
}

function updateScrollPosition() {
    const targetArticle = articles[currentArticleIndex];
    targetArticle.scrollIntoView({ behavior: 'smooth' });
}

scrollContainer.addEventListener('wheel', handleScroll);