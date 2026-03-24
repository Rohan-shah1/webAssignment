# Hospital Staff Management - Frontend (React)

A modern, responsive Single-Page Application (SPA) for managing hospital doctors and staff, built with React and Vite.

## Features
- **Role-Based Dashboards**:
    - **Admin**: Manage doctors (CRUD), assign rooms, and approve/reject leave applications.
    - **Staff (Doctor)**: View personal schedule, assigned room, and apply for leaves.
- **Dynamic Routing**: Powered by React Router for seamless navigation.
- **State Management**: Using React Hooks and centralized API utilities.
- **Professional UI**: Clean, responsive design with real-time status updates.

## Setup & Running
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure
- `src/api/`: Centralized API communication layer.
- `src/pages/`: Main application views (Home, Login, Dashboard).
- `src/App.jsx`: Root component with routing configuration.
- `src/style.css`: Global styling and design system.

## Proxy Configuration
The frontend is configured to proxy `/api` requests to `http://localhost:3000` via `vite.config.js`. Ensure the backend server is running for full functionality.
