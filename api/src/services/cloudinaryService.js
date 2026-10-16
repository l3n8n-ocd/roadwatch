const cloudinary = require('cloudinary').v2;
const { Readable } = require('node:stream');
const HttpError = require('../utils/httpError');

// Reads CLOUDINARY_URL from the environment automatically. Only the returned HTTPS URL is saved in MySQL.
function uploadImageBuffer(buffer, publicId) {
  if (!process.env.CLOUDINARY_URL || process.env.CLOUDINARY_URL.includes('API_KEY:API_SECRET')) {
    throw new HttpError(503, 'Photo storage is not configured (set CLOUDINARY_URL).');
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'roadwatch/reports', resource_type: 'image', public_id: publicId, allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
      (error, result) => (error ? reject(new HttpError(502, 'Photo upload failed')) : resolve(result))
    );
    Readable.from(buffer).pipe(stream);
  });
}

module.exports = { uploadImageBuffer };
