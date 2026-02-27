const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,          // Allow up to 10 concurrent DB connections
      serverSelectionTimeoutMS: 5000,  // Fail fast if Atlas unreachable
      socketTimeoutMS: 45000,   // Close idle sockets after 45s
      connectTimeoutMS: 10000,  // Give up connecting after 10s
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
