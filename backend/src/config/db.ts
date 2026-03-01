// backend/src/config/db.ts
// MongoDB connection setup using Mongoose
import mongoose from 'mongoose';

/**
 * Connect to MongoDB using the connection string from environment variables.
 * Falls back to local MongoDB if MONGODB_URI is not set.
 */
const connectDB = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swasthai';
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

export default connectDB;
