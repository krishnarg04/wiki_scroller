# Vertical Scrolling Wikipedia Viewer

## Overview
The Vertical Scrolling Wikipedia Viewer is a web application that allows users to browse Wikipedia articles in a visually appealing vertical scrolling format. The application features a glassmorphism design for enhanced aesthetics and includes a local recommendation system to suggest articles based on user interactions.

## Project Structure
```
wiki_scroller
├── index.html          # Main HTML document for the application
├── css
│   ├── style.css      # Main styles for layout and typography
│   └── glassmorphism.css # Styles for glassmorphism effect
├── js
│   ├── app.js         # Main JavaScript entry point
│   ├── api.js         # Handles API requests to fetch Wikipedia articles
│   ├── scroll.js      # Manages vertical scrolling behavior
│   └── recommendations.js # Implements local recommendation system
├── assets
│   └── icons
│       └── favicon.svg # Favicon for the web application
└── README.md          # Documentation for the project
```

## Features
- Vertical scrolling interface for seamless browsing of Wikipedia articles.
- Article image displayed at the top of each article view.
- Glass div in the middle of the screen displaying the article title and text with a translucent effect.
- Local recommendation system that suggests articles based on user interactions, utilizing local storage.

## Setup Instructions
1. Clone the repository to your local machine.
2. Open the `index.html` file in a web browser to view the application.
3. Ensure that you have an internet connection for fetching Wikipedia articles.

## Usage Guidelines
- Scroll vertically to navigate through articles.
- Click on recommended articles to view them.
- The application will remember your interactions and suggest articles accordingly.

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.