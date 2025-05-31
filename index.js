import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './DB/connection';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

await connectDB();

// app.use("auth",)

app.all("*", (req, res, next) => {
    return next(new Error(`page not found `, { cause: 404 }));
});
app.use((err, req, res, next) => {
    const statusCode = err.cause || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        stack: err.stack,
        message: message,
    });
});

app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
