const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the cors package
const { createBucketClient } = require('@cosmicjs/sdk');
const multer = require('multer');
const upload = multer();

const app = express();

// Enable CORS for all origins
app.use(cors());

// Parse JSON request bodies
app.use(bodyParser.json());

// Initialize Cosmic client
const cosmic = createBucketClient({
    bucketSlug: 'fibersight-alerts-production',
    readKey: '7bKsuejsBbngKgfUzM6EF9ql8DcIajDqpwZDcraf61i3w9BqPg',
    writeKey: 'afaxtVv2GcqAENF1DUu5L363VE75sHoSdJlqvIgA4qVkAXeXOp',
});

// Endpoint to save a profile
/*app.post('/api/save-profile', async (req, res) => {
    const { slug, profileData } = req.body;

    try {
        console.log('Saving profile with slug:', slug);
        console.log('Profile data:', profileData);

        if (!profileData.profilePicture) {
            console.warn('No profile picture provided in profileData');
        } else {
            console.log('Profile picture URL:', profileData.profilePicture);
        }

        const { object } = await cosmic.objects.findOne({ slug });
        console.log('Fetched object:', object)

        const { password, ...safeData } = profileData;
        let result = null;

        if (object) {
            console.log('Updating existing profile');

            const updatePayload = {
                title: object.title,
                metadata: {
                    ...object.metadata,
                    firstname: safeData.firstName,
                    lastname: safeData.lastName,
                    email: safeData.email,
                    phone: safeData.phone,
                    position: safeData.position,
                    profilepicture: typeof safeData.profilePicture === 'string'
                        ? {
                            url: safeData.profilePicture,
                            imgix_url: safeData.profilePicture,
                        }
                        : {
                            url: safeData.profilePicture.url,
                            imgix_url: safeData.profilePicture.imgix_url,
                        },
                },
            };

            console.log('Update payload:', updatePayload);
            try {
                const response = await cosmic.objects.updateOne({
                    id: object.id,
                    title: slug,
                    metadata: {
                        firstname: safeData.firstName,
                        lastname: safeData.lastName,
                        email: safeData.email,
                        phone: safeData.phone,
                        position: safeData.position,
                        password: object.metadata.password,
                        profilepicture: {
                            url: safeData.profilePicture,
                            imgix_url: safeData.profilePicture
                        }
                    }
                });

                console.log("Update success:", response);
                return res.status(200).json({ success: true, message: 'Profile updated successfully' });
            } catch (error) {
                console.error('Cosmic update error:', error.response?.data || error.message || error);
                return res.status(500).json({ success: false, message: 'Failed to update profile', error });
            }
        }
        return res.status(200).json({ success: true, message: 'Profile updated successfully', result });
    } catch (error) {
        console.error('Error saving profile:', error);
        return res.status(500).json({ error: 'Failed to save profile' });
    }
});*/


app.post('/api/save-profile', async (req, res) => {
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

        // Following the exact documentation format
        const response = await cosmic.objects.updateOne(existingProfile.object.id, {
            metadata: {
                firstname: profileData.firstName,
                lastname: profileData.lastName,
                email: profileData.email,
                phone: profileData.phone,
                position: profileData.position,
                password: existingProfile.object.metadata.password,
                profilepicture: profileData.profilePicture.mediaName // Use just the filename
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


app.post('/api/upload-media', upload.single('media'), async (req, res) => {
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

app.get('/', (req, res) => {
    res.send('Backend server is running');
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});