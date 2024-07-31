require('dotenv').config();

// Middleware function to check API key
const checkApiKey = (req, res, next) => {
    const receivedApiKey = req.headers['x-api-key'];

    // Compare the received API key with the one in .env file
    if (receivedApiKey && receivedApiKey === process.env.API_KEY) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized: Invalid API key' });
    }
};

export default checkApiKey;
