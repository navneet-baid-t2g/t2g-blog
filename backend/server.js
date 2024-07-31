const express = require('express');
const http = require('http');
const cors = require('cors');
const db = require('./lib/db');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

// Import routes
const postsRoutes = require('./routes/posts');
const authorsRoutes = require('./routes/authors');
const categoriesRoutes = require('./routes/categories');
const tagsRoutes = require('./routes/tags');

// Import logger
const logger = require('./lib/logger'); // Adjust path as necessary

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Enable CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));

// Swagger setup
const swaggerOptions = {
    swaggerDefinition: require('./swagger.json'),
    apis: ['./routes/*.js'],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
    customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { font-family: Arial, sans-serif; }
        .swagger-ui .info .title { font-size: 2em; color: #4CAF50; }
        .swagger-ui .info .description { font-size: 1.2em; color: #666; }
    `,
    customfavIcon: './public/asset/img/favicon.ico',
    customSiteTitle: 'Tech2Globe Blogs API Documentation',
    docExpansion: 'none',
    displayRequestDuration: true,
}));

// Use routes
app.use('/api/posts', postsRoutes);
app.use('/api/authors', authorsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/tags', tagsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('An error occurred:', { message: err.message, stack: err.stack });
    res.status(500).json({ error: 'An unexpected error occurred' });
});

// Create HTTP server
const server = http.createServer(app);

// Connect to the database and start the server
db.getConnection()
    .then(() => {
        logger.info('Connected to the MySQL database.');
        server.listen(port, () => {
            logger.info(`Server is running on port ${port}`);
        });
    })
    .catch(err => {
        logger.error('Error connecting to the database:', { message: err.message, stack: err.stack });
        process.exit(1);
    });

// Handle graceful shutdown
const handleShutdown = async (signal) => {
    logger.info(`${signal} signal received. Closing HTTP server...`);

    // Close the HTTP server
    server.close(async () => {
        logger.info('HTTP server closed.');

        // Attempt to end all connections in the pool
        try {
            await db.end();
            logger.info('Database connection pool closed.');
        } catch (err) {
            logger.error('Error closing the database connection pool:', { message: err.message, stack: err.stack });
            process.exit(1);
        }

        // Flush logs before exiting
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    });
};


process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
