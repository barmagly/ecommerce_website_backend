const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

// Import routers
const productRouter = require('./routers/product.routes');
const categoryRouter = require('./routers/category');
const cartRouter = require('./routers/cart');
const orderRouter = require('./routers/order');
const reviewRouter = require('./routers/review');
const couponRouter = require('./routers/coupon');
const userRouter = require('./routers/user');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('static'));
// CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Database connection
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    const opts = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // Add serverless-specific options
        bufferCommands: false,
        maxPoolSize: 1,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    };

    try {
        const db = await mongoose.connect('mongodb+srv://barmaglyy:Wr4sTf0EjgvwvEGn@ecommerc.orhrblw.mongodb.net/?retryWrites=true&w=majority&appName=Ecommerc', opts);
        cachedDb = db;
        console.log('MongoDB connection established');
        return db;
    } catch (err) {
        console.log('MongoDB connection error:', err);
        throw err;
    }
}

// Initialize app with database connection first
const startServer = async () => {
    try {
        // Wait for database connection
        await connectToDatabase();
        console.log('Database connection ready');

        // Swagger UI
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

        // API Routes
        app.use('/api/auth', userRouter);
        app.use('/api/products', productRouter); // This includes nested variant routes
        app.use('/api/categories', categoryRouter);
        app.use('/api/cart', cartRouter);
        app.use('/api/orders', orderRouter);
        app.use('/api/reviews', reviewRouter);
        app.use('/api/coupons', couponRouter);

        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error('Error:', err.message);
            res.status(500).json({
                status: 'error',
                message: err.message
            });
        });

        // 404 handler
        app.use((req, res) => {
            console.log(`Route not found: ${req.method} ${req.url}`);
            res.status(404).json({
                status: 'error',
                message: 'Route not found'
            });
        });

        // Start server
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server started on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();