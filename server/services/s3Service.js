// server/services/s3Service.js
const { S3Client } = require('@aws-sdk/client-s3');
const { createPresignedPost } = require('@aws-sdk/s3-request-presigner');
// Note: For R2, createPresignedPost is often used.
// createPresignedUrl is also an option for GET/PUT operations.
const { v4: uuidv4 } = require('uuid'); // For unique filenames
const path = require('path');

// Install uuid: npm install uuid
// Use uuid/v4 for CommonJS:
// If you encounter "uuid/v4 is not a function", try:
// const { v4: uuidv4 } = require('uuid');
// or if your project uses ESM: import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
  region: 'auto', // R2 typically uses 'auto' or a specific region like 'us-east-1' with global endpoints
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Function to generate a presigned POST URL for uploads
const generatePresignedPost = async (fileType, userId) => {
  const fileExtension = path.extname(fileType).toLowerCase(); // Extract extension from MIME type if possible
  const mimeType = fileType; // Keep the full mime type
  
  // Create a unique filename for S3/R2.
  // Example: `profile-pictures/userId/uniqueId.jpg`
  const key = `profile-pictures/${userId}/${uuidv4()}${fileExtension}`;

  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Conditions: [
      ['content-length-range', 0, 50 * 1024 * 1024], // Max 50 MB
      { 'Content-Type': mimeType },
    ],
    Fields: {
      'Content-Type': mimeType,
    },
    Expires: 300, // URL expires in 300 seconds (5 minutes)
  };

  try {
    const presignedPost = await createPresignedPost(s3, params);
    // console.log('Generated Presigned Post:', presignedPost);
    return {
      ...presignedPost,
      fileUrl: `${presignedPost.url}/${key}`, // The final URL where the file will be
      objectKey: key // The key needed to construct the public URL
    };
  } catch (error) {
    console.error('Error generating presigned POST URL:', error);
    throw error;
  }
};

module.exports = {
  generatePresignedPost,
};