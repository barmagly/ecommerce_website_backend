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
        const result = await cloudinary.uploader.upload(file.path, {
            folder: folder,
            resource_type: 'auto'
        });
        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        throw new Error('Error uploading to Cloudinary');
    }
};

module.exports = {
    uploadToCloudinary
};
