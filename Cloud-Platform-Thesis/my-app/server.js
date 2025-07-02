const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the cors package
const { createBucketClient } = require('@cosmicjs/sdk');
const multer = require('multer');
const upload = multer();
const bcrypt = require('bcrypt');


const app = express();

// Enable CORS for all origins
app.use(cors({
    origin: 'http://localhost:3000', // Your frontend origin
    credentials: true
}));

// Parse JSON request bodies
app.use(bodyParser.json());

// Initialize Cosmic client
const cosmic = createBucketClient({
    bucketSlug: 'fibersight-alerts-production',
    readKey: '7bKsuejsBbngKgfUzM6EF9ql8DcIajDqpwZDcraf61i3w9BqPg',
    writeKey: 'afaxtVv2GcqAENF1DUu5L363VE75sHoSdJlqvIgA4qVkAXeXOp',
});

app.post('/save-profile', async (req, res) => {
    const { slug, profileData } = req.body;

    try {
        // Get existing profile
        const existingProfile = await cosmic.objects.findOne({
            slug,
            props: 'id,metadata'
        });

        if (!existingProfile.object) {
            return res.status(404).json({
                success: false,
                message: `Profile not found for slug: ${slug}`
            });
        }

        const response = await cosmic.objects.updateOne(existingProfile.object.id, {
            metadata: {
                firstname: profileData.firstName,
                lastname: profileData.lastName,
                email: profileData.email,
                phone: profileData.phone,
                position: profileData.position,
                password: existingProfile.object.metadata.password,
                profilepicture: profileData.profilePicture.mediaName
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: response
        });

    } catch (error) {
        console.error('Update error:', {
            message: error.message,
            response: error.response?.data,
            stack: error.stack
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
});


app.post('/upload-media', upload.single('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const mediaResponse = await cosmic.media.insertOne({
            media: {
                buffer: req.file.buffer,
                originalname: req.file.originalname
            }
        });

        if (!mediaResponse?.media?.url) {
            throw new Error('Invalid media response from Cosmic');
        }

        return res.status(200).json({
            success: true,
            mediaUrl: mediaResponse.media.url,
            mediaName: mediaResponse.media.name
        });

    } catch (error) {
        console.error('Media upload error:', error);
        return res.status(500).json({
            error: 'Failed to upload media',
            details: error.message
        });
    }
});

app.post('/update-password', async (req, res) => {
    const { slug, currentPassword, newPassword } = req.body;

    try {
        const existingProfile = await cosmic.objects.findOne({
            slug,
            props: 'id,metadata'
        });

        if (!existingProfile || !existingProfile.object) {
            return res.status(404).json({
                success: false,
                message: `Profile not found for slug: ${slug}`
            });
        }

        const storedPassword = existingProfile.object.metadata.password;
        let passwordMatches = false;

        if (storedPassword.startsWith('$2b$')) { // bcrypt hashes start with $2b$
            passwordMatches = await bcrypt.compare(currentPassword, storedPassword);
        } else {
            // Fallback to plain text comparison for legacy users
            passwordMatches = currentPassword === storedPassword;
        }

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const response = await cosmic.objects.updateOne(existingProfile.object.id, {
            metadata: {
                password: hashedPassword
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: response
        })

    } catch (error) {
        console.error('Error while updating password', error);
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // List all users and filter by email
        const users = await cosmic.objects.find({
            type: 'profiles',
            props: 'slug,metadata'
        });

        // Find user by email
        const user = users.objects.find(u => u.metadata.email === email);

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const storedPassword = user.metadata.password;

        let passwordMatches = false;
        if (storedPassword && storedPassword.startsWith('$2b$')) {
            passwordMatches = await bcrypt.compare(password, storedPassword);
        } else {
            passwordMatches = password === storedPassword;
        }

        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Remove password before sending user data
        const { password: _, ...safeUserData } = user.metadata;

        return res.status(200).json({
            token: user.slug,
            user: { ...safeUserData, slug: user.slug }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

app.post('/create-account', async (req, res) => {
    const { firstName, lastName, email, phone, position, password, profilePicture } = req.body;

    try {
        // Check if user already exists
        const users = await cosmic.objects.find({
            type: 'profiles',
            props: 'metadata'
        });
        const exists = users.objects.some(u => u.metadata.email === email);
        if (exists) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user object
        const response = await cosmic.objects.insertOne({
            title: `${firstName} ${lastName}`,
            type: 'profiles',
            metadata: {
                firstname: firstName,
                lastname: lastName,
                email,
                phone,
                position,
                password: hashedPassword,
                profilepicture: profilePicture || ''
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: response
        });
    } catch (error) {
        console.error('Create account error:', error);
        return res.status(500).json({ message: 'Failed to create account' });
    }
});

app.get('/profiles', async (req, res) => {
    try {
        const result = await cosmic.objects.find({
            type: 'profiles',
            props: 'slug,metadata'
        });
        res.json({ profiles: result.objects });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch profiles' });
    }
});

app.delete('/profiles/:id', async (req, res) => {
    const { id } = req.params;
    console.log('Attempting to delete profile with ID:', id);
    try {
        // Correct usage: pass the id as a string, not as an object
        const response = await cosmic.objects.deleteOne(id);
        res.json({ success: true, message: 'Profile deleted', data: response });
    } catch (error) {
        console.error('Delete profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete profile', error: error.message });
    }
});


app.get('/', (req, res) => {
    res.send('Backend server is running');
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});