const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error("MONGODB_URI is not defined in .env file");
            process.exit(1);
        }
        await mongoose.connect(uri);
        console.log('MongoDB Atlas Connected successfully');
    } catch (error) {
        console.error('MongoDB Atlas connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
