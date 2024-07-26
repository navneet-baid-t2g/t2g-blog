import { connectToDatabase } from '../../../lib/db';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { name, email, website, comment, postId } = req.body;

            // Validate input
            if (!name || !email || !comment || !postId) {
                return res.status(400).json({ message: 'Name, email, comment, and post ID are required' });
            }

            // Sanitize inputs
            const sanitizeInput = (input) => input ? input.replace(/'/g, "''") : '';
            const sanitizedName = sanitizeInput(name);
            const sanitizedEmail = sanitizeInput(email);
            const sanitizedWebsite = sanitizeInput(website);
            const sanitizedComment = sanitizeInput(comment);

            // Insert the comment into the database
            const query = `
                INSERT INTO wp_comments (comment_post_ID, comment_author, comment_author_email, comment_author_url, comment_content, comment_date, comment_approved)
                VALUES (?, ?, ?, ?, ?, NOW(), '1')
            `;

            const values = [postId, sanitizedName, sanitizedEmail, sanitizedWebsite, sanitizedComment];

            const db = await connectToDatabase();

            // Use async/await for the query execution
            await db.query(query, values);
            await db.end();

            console.log('Comment submitted successfully');
            return res.status(200).json({ message: 'Comment submitted successfully' });

        } catch (error) {
            console.error('Error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
