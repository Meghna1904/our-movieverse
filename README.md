🎬 MovieVerse

A personal movie discovery and watchlist web app built to make it easy to explore movies and keep track of what you want to watch.

🌐 Live Demo: https://our-movieverse.vercel.app/

✨ Features
🎥 Browse and explore movies
🔎 Search for movies
📋 Create and manage personal watchlists
❤️ Save movies for later
🗂️ Organize saved movies into collections
🔐 User based data with Supabase
📱 Responsive interface for desktop and mobile
⚡ Fast, modern React based UI
🛠️ Tech Stack
Frontend: React, TypeScript
Framework: TanStack Start
Styling: Tailwind CSS
Backend / Database: Supabase
Data Fetching: TanStack Query
Validation: Zod
Icons: Lucide React
Deployment: Vercel
🏗️ Project Structure
src/
├── components/          # Reusable UI components
├── hooks/               # Custom React hooks
├── integrations/
│   └── supabase/        # Supabase integration
├── lib/                 # Utility functions
├── routes/               # Application routes
├── server.ts            # Server configuration
├── start.ts             # Application entry
└── styles.css           # Global styles

supabase/
└── Database configuration and migrations
🚀 Getting Started
Prerequisites

Make sure you have:

Node.js installed
A Supabase project
Git installed
Installation

Clone the repository:

git clone https://github.com/Meghna1904/our-movieverse.git
cd our-movieverse

Install dependencies:

npm install
Environment Variables

Create a .env file and add your Supabase credentials:

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
Run locally
npm run dev

The application will be available at the local development URL shown in your terminal.

📌 What I Built

MovieVerse was built as a practical full stack web project to explore how a modern React application can work with a cloud database and persistent user data.

The project gave me hands on experience with component based UI development, database integration, asynchronous data handling, and deploying a web application.

🔮 Future Improvements
Add movie recommendations based on watchlist activity
Improve filtering and sorting
Add more detailed movie information
Add sharing options for watchlists
Improve accessibility and performance
👩‍💻 Author

Meghna

GitHub: https://github.com/Meghna1904
