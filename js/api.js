// This file handles API requests to fetch Wikipedia articles. It contains functions to retrieve article data, including images, titles, and text.

const API_URL = 'https://en.wikipedia.org/w/api.php';

// Function to fetch article data from Wikipedia
async function fetchArticle(title) {
    const response = await fetch(`${API_URL}?action=query&format=json&origin=*&titles=${encodeURIComponent(title)}&prop=extracts|pageimages&exintro&explaintext&piprop=original`);
    const data = await response.json();
    const page = Object.values(data.query.pages)[0];
    return {
        title: page.title,
        extract: page.extract,
        image: page.original ? page.original.source : null
    };
}

// Function to search for articles based on a query
async function searchArticles(query) {
    const response = await fetch(`${API_URL}?action=query&list=search&format=json&origin=*&srsearch=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.query.search.map(article => article.title);
}