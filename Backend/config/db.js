/**
 * @fileoverview Establishes a connection to the MongoDB database for the TrueScope project.
 * This module uses Mongoose to connect to the MongoDB instance defined in environment variables.
 * It provides centralized database connection management with proper error handling.
 */

import mongoose from "mongoose";

/**
 * Connects the application to the MongoDB database.
 * Utilizes the MONGO_URI environment variable for connection configuration.
 *
 * @async
 * @function connectDB
 * @throws {Error} If the database connection fails, the process exits with code 1.
 * @returns {Promise<void>} Resolves when the connection is successfully established.
 * 
 * @example
 * // Usage in server entry file (e.g., server.js or index.js)
 * import connectDB from "./config/db.js";
 * 
 * connectDB()
 *   .then(() => console.log("Database connected successfully"))
 *   .catch((err) => console.error("Database connection failed:", err));
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1); // Exit the process on connection failure
  }
};

export default connectDB;
