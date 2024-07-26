// pages/api/comments.js
import { connectToDatabase } from '../../lib/db';
import { apiKeyAuthMiddleware } from '../../lib/auth';

const handler = async (req, res) => {
    const { method, query } = req;

    if (method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests are allowed' });
    }

    const { postId } = query;

    if (!postId) {
        return res.status(400).json({ message: 'Bad Request: postId is required' });
    }

    try {
        const connection = await connectToDatabase();
        const [rows] = await connection.execute('SELECT * FROM wp_comments WHERE comment_post_ID = ? AND comment_approved = "1"', [postId]);
        await connection.end();

        res.status(200).json({ comments: rows });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export default apiKeyAuthMiddleware(handler);
