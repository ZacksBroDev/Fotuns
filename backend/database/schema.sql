-- The Futons Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS futons_band;
USE futons_band;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    newsletter_subscribed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Concerts table
CREATE TABLE IF NOT EXISTS concerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    venue VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Songs table
CREATE TABLE IF NOT EXISTS songs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    release_date DATE,
    spotify_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Contact submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, password, newsletter_subscribed) 
VALUES (
    'Admin User', 
    'admin@futons.com', 
    '$2b$10$8ZzJ4EtmQ6jL7VnK2EHyKeF3KGsXPQ1jYfJ7GQ6rXGhqR3gNzOqVy',
    TRUE
) ON DUPLICATE KEY UPDATE name = name;

-- Insert sample concerts
INSERT INTO concerts (title, date, venue, description) VALUES
('Denver Music Festival', '2025-06-15', 'Downtown Denver Park', 'Join us for an amazing outdoor music festival!'),
('Indie Night at The Bluebird', '2025-08-10', 'The Bluebird Theater', 'An intimate evening of indie music.'),
('Summer Concert Series', '2025-07-25', 'Red Rocks Amphitheatre', 'Special performance at the iconic Red Rocks venue.')
ON DUPLICATE KEY UPDATE title = title;

-- Insert sample songs
INSERT INTO songs (title, genre, release_date, spotify_url) VALUES
('Skeuomorph', 'Indie Pop', '2024-01-15', 'https://open.spotify.com/track/3F4bilF6RN2IaSsQrNs4Vr'),
('Wematanye', 'Indie Rock', '2024-03-20', 'https://open.spotify.com/track/2K5s4yXx7M2GszC2XZ0mDv')
ON DUPLICATE KEY UPDATE title = title;
