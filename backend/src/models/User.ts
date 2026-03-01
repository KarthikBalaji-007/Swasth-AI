// backend/src/models/User.ts
// Simple user model for reviewer/admin dashboard authentication
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    username: string;
    password: string;
    role: 'admin' | 'reviewer';
    displayName: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        username: { type: String, required: true, unique: true, trim: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['admin', 'reviewer'], default: 'reviewer' },
        displayName: { type: String, required: true }
    },
    { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords during login
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
