// pages/api/search.js
import { connectToDatabase } from '../../../lib/db';
import { getCache, setCache } from '../../../lib/cache'; // Import cache functions
import Fuse from 'fuse.js'; // Import fuse.js

const handler = async (req, res) => {
    const { method } = req;
    const { query } = req.query;

    if (method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests are allowed' });
    }

    if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
    }

    // Generate a cache key based on the query parameter
    const cacheKey = `search:${query}`;

    // Try to fetch cached data
    const cachedResults = getCache(cacheKey);
    if (cachedResults) {
        return res.status(200).json({ results: cachedResults });
    }

    try {
        const connection = await connectToDatabase();

        // Fetch all posts for searching
        const [rows] = await connection.execute(`
            SELECT ID, post_title, post_excerpt, post_name as slug
            FROM wp_posts
            WHERE post_type = 'post'
              AND post_status = 'publish'
        `);

        // Create a new Fuse instance
        const fuse = new Fuse(rows, {
            keys: ['post_title', 'post_excerpt'], // Keys to search in
            includeScore: true, // Include score to sort results by relevance
            threshold: 0.6, // Fuzzy search threshold (lower is more strict)
        });

        // Perform the search
        const result = fuse.search(query);

        // Cache the search results
        setCache(cacheKey, result.map(({ item }) => item));

        // Return the search results
        res.status(200).json({ results: result.map(({ item }) => item) });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export default handler;
