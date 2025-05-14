import { createBucketClient } from '@cosmicjs/sdk';
import { update } from 'plotly.js';

// Initialize
const cosmic = createBucketClient({
  bucketSlug: 'fibersight-alerts-production',
  readKey: '7bKsuejsBbngKgfUzM6EF9ql8DcIajDqpwZDcraf61i3w9BqPg',
  writeKey: 'afaxtVv2GcqAENF1DUu5L363VE75sHoSdJlqvIgA4qVkAXeXOp',
  //baseUrl: 'http://localhost:5000/cosmic',
});

export default cosmic;

export const authClient = createBucketClient({
  bucketSlug: 'fibersight-alerts-production',
  readKey: '7bKsuejsBbngKgfUzM6EF9ql8DcIajDqpwZDcraf61i3w9BqPg',
  writeKey: 'afaxtVv2GcqAENF1DUu5L363VE75sHoSdJlqvIgA4qVkAXeXOp',
  //baseUrl: 'http://localhost:5000/cosmic',
});

export const cosmicAuth = async (email, password) => {
  try {
    // Find user by email in Cosmic
    const { objects } = await cosmic.objects.find({
      type: 'profiles',
      'metadata.email': email,
    }).props('slug,title,metadata');

    if (!objects || objects.length === 0) {
      throw new Error('User not found');
    }

    const userProfile = objects[0];
    const user = userProfile.metadata;

    // Basic password check (in production, use proper hashing)
    if (user.password !== password) {
      throw new Error('Invalid password');
    }

    // Return user data without password
    const { password: _, ...safeUserData } = user;
    return {
      token: userProfile.slug, // Using Cosmic object slug as token
      user: safeUserData,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

// Fetch profile by user ID
export const getCosmicProfile = async (slug) => {
  try {
    const { object } = await cosmic.objects.findOne({ slug }).props('metadata');

    if (!object) throw new Error('Profile not found');

    // Remove password before returning
    const { password, ...profile } = object.metadata;
    return profile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

// Save profile to Cosmic
export const saveCosmicProfile = async (slug, profileData) => {
  try {
    console.log('Profile data being sent:', {
      slug,
      profileData: JSON.stringify(profileData, null, 2)
    });

    const response = await fetch('http://localhost:5000/api/save-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug, profileData }),
    });

    // Get the response body as text first
    const responseText = await response.text();
    console.log('Raw server response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', e);
      throw new Error('Server returned invalid JSON');
    }

    if (!response.ok) {
      throw new Error(`Server error: ${data.message || data.error || response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('Profile save error details:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};