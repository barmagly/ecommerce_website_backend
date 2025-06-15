const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://barmaglyy:Wr4sTf0EjgvwvEGn@ecommerc.orhrblw.mongodb.net/?retryWrites=true&w=majority&appName=Ecommerc';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

const db = mongoose.connection;
db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

db.once('open', () => {
  console.log('Connected to MongoDB Atlas');
});

module.exports = mongoose; 