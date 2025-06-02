const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: 'disjyrtjb',
    api_key: '463432616887871',
    api_secret: 'wOhEkN0R8ulEUFQSAhOIPw0zXy4'
});

// Upload file to Cloudinary
const uploadToCloudinary = async (file, folder) => {
    try {
        // Convert buffer to base64
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: folder,
            resource_type: 'auto'
        });
        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Error uploading to Cloudinary');
    }
};

module.exports = {
    uploadToCloudinary
};
