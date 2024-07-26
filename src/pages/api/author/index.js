// pages/api/authors.js
import { connectToDatabase } from '../../../lib/db';
import { apiKeyAuthMiddleware } from '../../../lib/auth';

const handler = async (req, res) => {
    const { method } = req;

    if (method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests are allowed' });
    }

    try {
        const connection = await connectToDatabase();

        // Update the query to include additional fields
        const query = `
            SELECT 
                u.ID, 
                u.display_name, 
                u.user_url AS website,
                MAX(CASE WHEN pm.meta_key = 'facebook' THEN pm.meta_value END) AS facebook_handle,
                MAX(CASE WHEN pm.meta_key = 'instagram' THEN pm.meta_value END) AS instagram_handle,
                MAX(CASE WHEN pm.meta_key = 'description' THEN pm.meta_value END) AS description,
                (SELECT meta_value FROM wp_usermeta WHERE user_id = u.ID AND meta_key = 'profile_image') AS profile_image
            FROM wp_users u
            LEFT JOIN wp_usermeta pm ON u.ID = pm.user_id 
            GROUP BY u.ID, u.display_name, u.user_url
        `;
    
        const [rows] = await connection.execute(query);
        await connection.end();

        // Format the response
        const authors = rows.map(row => ({
            id: row.ID,
            displayName: row.display_name,
            description: row.description || '',
            website: row.website || '',
            socialHandles: [row.facebook_handle || '', row.instagram_handle || ''].filter(handle => handle !== ''),
            profileImage: row.profile_image || ''
        }));

        res.status(200).json({ authors });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export default (handler);
