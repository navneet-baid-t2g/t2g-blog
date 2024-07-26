// pages/api/search.js
import { connectToDatabase } from '../../lib/db';

const handler = async (req, res) => {
    const { method } = req;
    const { query } = req.query;

    if (method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests are allowed' });
    }

    if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
    }

    try {
        const connection = await connectToDatabase();

        // Replace with your actual SQL query to search blog posts
        const [rows] = await connection.execute(`
            SELECT ID, post_title, post_excerpt, post_name as slug
            FROM wp_posts
            WHERE post_type = 'post'
            AND post_status = 'publish'
            AND post_title LIKE ?
            LIMIT 10
        `, [`%${query}%`]);
        await connection.end();

        res.status(200).json({ results: rows });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export default handler;
