# SPEND SENSE

## Overview

SPEND SENSE is a full-stack expense tracking web application designed to help users manage their finances efficiently. Built with a React frontend and a Node.js/Express backend, it offers expense tracking, group bill splitting, AI-powered chatbot assistance, OCR receipt scanning, financial goal setting, and Google OAuth authentication.

---

## Features

### Frontend
- **React with Vite**: Fast and optimized development environment
- **Responsive Design**: Compatible across all devices
- **Dynamic Components**: Modular and reusable React components
- **State Management**: Efficient application state handling
- **Modern Styling**: Tailwind CSS for clean, modern UI

### Backend
- **Node.js with Express**: Lightweight and scalable backend
- **MongoDB**: NoSQL database for flexible data storage
- **JWT Authentication**: Secure token-based user login and registration
- **Google OAuth 2.0**: Sign in with Google via Passport.js
- **Session Management**: Persistent sessions with `express-session`
- **RESTful APIs**: Clean endpoints for all frontend operations
- **AI Chatbot**: Gemini-powered financial assistant
- **OCR Receipt Scanning**: Extract expense data from receipt images using Gemini Vision
- **Group Expense Management**: Create groups and split bills among members
- **Financial Goals**: Set and track savings/spending goals
- **Activity Logs**: Track user activity across the application
- **Health Check Endpoint**: Monitor uptime, memory, CPU, and DB response time

---

## Project Structure

```
Expense-Tracker-Opensoft/
├── Readme.md
├── docker-compose.yml
├── deploy.sh
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── db/
│       ├── middleware/
│       ├── models/
│       └── routers/
└── frontend/
    ├── .env
    ├── .env.example
    ├── .gitignore
    ├── Dockerfile
    ├── eslint.config.js
    ├── index.html
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── public/
    └── src/
        ├── App.css
        ├── index.css
        ├── Layout.jsx
        ├── main.jsx
        ├── assets/
        └── components/
```

---

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Google Cloud project (for OAuth & Gemini API)

### Backend Setup

1. Navigate to the `backend` directory:
   ```sh
   cd backend
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Configure environment variables by copying `.env.example` to `.env`:
   ```sh
   cp .env.example .env
   ```

4. Fill in your `.env`:
   ```env
   PORT=5000
   mongoDBURL=your_mongodb_connection_string
   JWT_SECRET=any_random_secret_string
   SESSION_SECRET=another_random_secret_string
   FRONTEND_URL=http://localhost:5173
   BACKEND_URL=http://localhost:5000

   # Required for Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Required for AI Chatbot and OCR Receipt Scanning
   # Get a free key from https://aistudio.google.com/apikey
   GEMINI_API_KEY=your_gemini_api_key
   ```

5. Start the server:
   ```sh
   npm start
   ```

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. Enable **Google+ API** and **OAuth 2.0**.
3. Create OAuth 2.0 credentials and set the redirect URI to:
   ```
   http://localhost:5000/api/oauth/google/callback
   ```
4. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to your backend `.env`.

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```sh
   cd frontend
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Configure environment variables:
   ```sh
   cp .env.example .env
   ```

4. Start the development server:
   ```sh
   npm run dev
   ```

---

## Docker Setup

The project includes a `docker-compose.yml` for running all services together (MongoDB, backend, frontend with Nginx).

```sh
docker-compose up --build
```

Services:
- **MongoDB**: Runs on port `27017` with persistent volume
- **Backend**: Connects to MongoDB, reads from `backend/.env`
- **Frontend**: Served via Nginx on ports `80` and `443`, supports HTTPS with Let's Encrypt certificates

> Make sure `backend/.env` and `frontend/.env` are populated before running Docker.

---

## Usage

1. Open the app at `http://localhost:5173` (dev) or `http://localhost` (Docker)
2. Register or log in with email/password or Google OAuth
3. Add, edit, or delete expenses
4. Create groups and split bills with other users
5. Set financial goals and track progress
6. Use the AI chatbot for financial insights
7. Scan receipts using the OCR feature to auto-fill expenses

---

## API Health Check

```
GET /health
```

Returns server uptime, memory usage, CPU load, and database response time.

---

## Technologies Used

### Frontend
- React
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- Passport.js (Google OAuth)
- express-session
- JSON Web Tokens (JWT)
- Google Gemini API (Chatbot + OCR)

### Infrastructure
- Docker & Docker Compose
- Nginx (reverse proxy + SSL)
- Let's Encrypt (HTTPS)

---

## Team Members

| Name |
|------|
| Shivam Kumar |
| Madhav Samdani |
| Harsh Dalmia |
| Ranveer Raj |
| Nikhil Patel |

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

Special thanks to the OpenSoft team for their support and guidance.
