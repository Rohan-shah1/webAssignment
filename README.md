# Hospital Staff Management - Backend

This is the backend server for the Doctor & Staff Management System, built with Node.js, Express, and MongoDB.

## Features
- **Authentication**: JWT-based login with role-based access control (Admin/Doctor).
- **Database**: MongoDB Atlas integration for persistent storage of staff and leave data.
- **File Storage**: Cloudinary integration for profile picture uploads.
- **RESTful API**: Comprehensive endpoints for staff management and leave applications.

## Prerequisites
- Node.js (v16+)
- MongoDB Atlas account
- Cloudinary account

## Environment Variables
Create a `.env` file in the `backend/` directory with the following:
```env
PORT=3000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Setup & Running
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints
- **Auth**: `/api/auth/login`
- **Doctors**: `/api/doctors` (GET, POST), `/api/doctors/:id` (GET, PUT, DELETE)
- **Leaves**: `/api/leave/apply`, `/api/leave/my-leaves`, `/api/leave/all`, `/api/leave/:id/status`
