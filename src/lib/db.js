// lib/db.js
import mysql from 'mysql2/promise';

let pool;

export const connectToDatabase = async () => {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10, // Adjust based on your app's needs
            queueLimit: 0
        });
    }
    return pool.getConnection();
};
