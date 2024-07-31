// pages/api/tags.js
import { connectToDatabase } from '../../../lib/db';
import { getCache, setCache } from '../../../lib/cache'; // Import cache functions

const CACHE_KEY = 'tags'; // Define a cache key for tags

const handler = async (req, res) => {
    const { method } = req;

    if (method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests are allowed' });
    }

    // Try to fetch cached data
    const cachedTags = getCache(CACHE_KEY);
    if (cachedTags) {
        return res.status(200).json({ tags: cachedTags });
    }

    try {
        const connection = await connectToDatabase();

        // Fetch tags from the database
        const [rows] = await connection.execute(`
            SELECT * 
            FROM wp_terms 
            WHERE term_id IN (
                SELECT term_id 
                FROM wp_term_taxonomy 
                WHERE taxonomy = 'post_tag'
            )
        `);

        // Cache the tags
        setCache(CACHE_KEY, rows);

        // Return the tags
        res.status(200).json({ tags: rows });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export default handler;
