// backend/src/seed.ts
// Seeds the database with a demo reviewer account
// Run with: npm run seed
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User';

async function seed() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swasthai';
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('ℹ️  Admin user already exists. Skipping seed.');
        } else {
            // Create demo reviewer/admin account
            const admin = new User({
                username: 'admin',
                password: 'swasthya123',  // Will be hashed by pre-save hook
                role: 'admin',
                displayName: 'Dr. Admin (Demo)'
            });
            await admin.save();
            console.log('✅ Demo admin created: username=admin, password=swasthya123');
        }

        // Create a reviewer account too
        const existingReviewer = await User.findOne({ username: 'reviewer' });
        if (existingReviewer) {
            console.log('ℹ️  Reviewer user already exists. Skipping seed.');
        } else {
            const reviewer = new User({
                username: 'reviewer',
                password: 'review123',
                role: 'reviewer',
                displayName: 'Nurse Priya (Demo)'
            });
            await reviewer.save();
            console.log('✅ Demo reviewer created: username=reviewer, password=review123');
        }

        await mongoose.disconnect();
        console.log('✅ Seed complete. Database disconnected.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
}

seed();
