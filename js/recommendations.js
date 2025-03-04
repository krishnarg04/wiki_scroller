// This file implements the local recommendation system using local storage. 
// It contains functions to save, retrieve, and display recommended articles based on user interactions.

const recommendationsKey = 'wikiRecommendations';

// Function to save a recommended article to local storage
function saveRecommendation(article) {
    let recommendations = getRecommendations();
    if (!recommendations.includes(article)) {
        recommendations.push(article);
        localStorage.setItem(recommendationsKey, JSON.stringify(recommendations));
    }
}

// Function to retrieve recommended articles from local storage
function getRecommendations() {
    const recommendations = localStorage.getItem(recommendationsKey);
    return recommendations ? JSON.parse(recommendations) : [];
}

// Function to display recommended articles
function displayRecommendations() {
    const recommendations = getRecommendations();
    const recommendationsContainer = document.getElementById('recommendations');

    recommendationsContainer.innerHTML = ''; // Clear previous recommendations

    recommendations.forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.classList.add('recommendation-item');
        articleElement.textContent = article; // Assuming article is a string (title)
        recommendationsContainer.appendChild(articleElement);
    });
}

// Example usage: Call this function when an article is viewed
function onArticleViewed(articleTitle) {
    saveRecommendation(articleTitle);
    displayRecommendations();
}