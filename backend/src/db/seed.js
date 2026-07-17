import bcrypt from 'bcrypt';
import { User } from '../models/User.js';

export const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ email: 'admin@spendsense.com' });
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            const adminUser = new User({
                name: 'Super Admin',
                email: 'admin@spendsense.com',
                password: hashedPassword,
                role: 'Admin',
                status: 'Active'
            });

            await adminUser.save();
            console.log('Super Admin user seeded automatically.');
        } else {
            console.log('Admin user already exists.');
        }
    } catch (error) {
        console.error('Error seeding admin user:', error);
    }
};
