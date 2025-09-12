# The Futons - Band Website

A clean, simple static website for The Futons band from Denver, CO.

## Features

- **Hero Section**: Eye-catching landing with band logo and Spotify link
- **Music**: Latest releases with direct Spotify links
- **Gallery**: Photo gallery with lightbox viewer
- **About**: Band member information
- **Concerts**: Upcoming show listings with booking
- **Contact**: Contact form integration with Web3Forms

## Getting Started

### Simple Setup (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/ZacksBroDev/Fotuns.git
cd Fotuns
```

2. Start a local server:
```bash
# Using Python (Mac/Linux)
python3 -m http.server 3000

# Using Node.js
npx serve . -p 3000
```

3. Open http://localhost:3000 in your browser

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Modern CSS with gradients, animations, and responsive design
- **Forms**: Web3Forms integration for contact functionality
- **Hosting**: Static hosting compatible (GitHub Pages, Netlify, Vercel, etc.)

## Project Structure

```
├── index.html              # Main website file
├── styles/
│   └── style.css           # All styling
├── assets/
│   ├── icons/              # Logos and social media icons
│   └── img/               # Band photos and gallery images
└── README.md              # This file
```

## Customization

- **Colors**: Modify CSS variables in `styles/style.css`
- **Content**: Update text, links, and images in `index.html`
- **Photos**: Replace images in `assets/img/` folder
- **Contact Form**: Update Web3Forms access key in the form

## Deployment

This is a static website that can be deployed to any hosting service:

- **GitHub Pages**: Push to GitHub and enable Pages
- **Netlify**: Drag and drop the folder or connect to GitHub
- **Vercel**: Connect to GitHub repository
- **Traditional hosting**: Upload files to any web server

## License

© 2025 The Futons. Developed by ZackFullStack
