# Classroom Occupancy Tracker

A web application to track and manage classroom and lab occupancy in real-time.

## Features

- Real-time tracking of classroom and lab occupancy
- Faculty login system
- View available/occupied rooms and labs
- Toggle room/lab status (for faculty)
- Responsive design with modern UI

## Live Demo

- Frontend: https://manoharbetha.github.io/occupancy_tracker
- Backend: https://occupancy-tracker-backend.onrender.com

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/manoharbetha/occupancy_tracker.git
cd occupancy_tracker
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Set up environment variables:
Create a `.env` file in the backend directory with:
```
PORT=3002
MONGODB_URI=your_mongodb_connection_string
```

4. Start the backend server:
```bash
npm start
```

5. Open `frontend/index.html` in your browser

## Deployment

### Frontend
The frontend is deployed on GitHub Pages.

### Backend
The backend is deployed on Render.com with the following configuration:
- Build Command: `npm install`
- Start Command: `node backend/server.js`
- Environment Variables:
  - PORT: 3002
  - MONGODB_URI: MongoDB Atlas connection string

## Default Login Credentials
- Username: faculty
- Password: 1234
