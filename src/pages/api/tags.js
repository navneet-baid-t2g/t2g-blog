// pages/api/tags.js
import { connectToDatabase } from '../../lib/db';
import { apiKeyAuthMiddleware } from '../../lib/auth';

const handler = async (req, res) => {
    const { method } = req;

    if (method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests are allowed' });
    }

    try {
        const connection = await connectToDatabase();
        const [rows] = await connection.execute('SELECT * FROM wp_terms WHERE term_id IN (SELECT term_id FROM wp_term_taxonomy WHERE taxonomy = "post_tag")');
        await connection.end();

        res.status(200).json({ tags: rows });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export default apiKeyAuthMiddleware(handler);
