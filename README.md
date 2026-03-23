# RecipeNest - Backend API

The robust REST API powering the RecipeNest ecosystem, handling authentication, recipe data, and secure media storage.

## 🛠️ Tech Stack

- **Node.js & Express:** Scalable backend architecture.
- **MongoDB Atlas:** Cloud-hosted NoSQL database for flexible data modeling.
- **Cloudinary:** Secure cloud storage for high-quality chef profile pictures.
- **JWT:** Token-based secure authentication.
- **Multer:** Efficient processing of multipart/form-data for image uploads.

## 📂 Project Structure

- `models/`: Database schemas (User, Recipe).
- `routes/`: Express API endpoints.
- `controllers/`: Core business and upload logic.
- `middleware/`: Authentication guards and file filtering.
- `config/`: Third-party service configurations (Cloudinary).

## 🚀 Setup & Launch

1.  **Environment Variables:**
    Create a `.env` file with the following keys:
    - `MONGO_URI`
    - `JWT_SECRET`
    - `CLOUDINARY_CLOUD_NAME`
    - `CLOUDINARY_API_KEY`
    - `CLOUDINARY_API_SECRET`
2.  **Install Packages:**
    ```bash
    npm install
    ```
3.  **Start Server:**
    ```bash
    npm run dev
    ```

## 🔒 Security
No `.env` files or credentials are saved in this repository. All environment variables must be configured manually for local development.
