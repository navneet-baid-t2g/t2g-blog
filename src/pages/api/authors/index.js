// pages/api/authors.js
import { connectToDatabase } from '../../../lib/db';
import { getCache, setCache } from '../../../lib/cache'; // Import cache functions if you use caching
import crypto from 'crypto';

const handler = async (req, res) => {
    const { method } = req;

    if (method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests are allowed' });
    }

    // Generate a cache key based on the request
    const cacheKey = 'authors:all'; // Adjust if you use query parameters

    // Try to fetch cached data
    const cachedAuthors = getCache(cacheKey);
    if (cachedAuthors) {
        return res.status(200).json(cachedAuthors);
    }

    try {
        const connection = await connectToDatabase();

        // Updated query to include additional fields
        const query = `
            SELECT 
                u.ID, 
                u.display_name, 
                u.user_url AS website,
                MAX(CASE WHEN pm.meta_key = 'facebook' THEN pm.meta_value END) AS facebook,
                MAX(CASE WHEN pm.meta_key = 'instagram' THEN pm.meta_value END) AS instagram,
                MAX(CASE WHEN pm.meta_key = 'linkedin' THEN pm.meta_value END) AS linkedin,
                MAX(CASE WHEN pm.meta_key = 'tumblr' THEN pm.meta_value END) AS tumblr,
                MAX(CASE WHEN pm.meta_key = 'twitter' THEN pm.meta_value END) AS twitter,
                MAX(CASE WHEN pm.meta_key = 'youtube' THEN pm.meta_value END) AS youtube,
                MAX(CASE WHEN pm.meta_key = 'wikipedia' THEN pm.meta_value END) AS wikipedia,
                MAX(CASE WHEN pm.meta_key = 'pinterest' THEN pm.meta_value END) AS pinterest,
                MAX(CASE WHEN pm.meta_key = 'description' THEN pm.meta_value END) AS description,
                  u.user_email AS email
            FROM wp_users u
            LEFT JOIN wp_usermeta pm ON u.ID = pm.user_id 
            GROUP BY u.ID, u.display_name, u.user_url
        `;
    
        const [rows] = await connection.execute(query);
        const getGravatarUrl = (email) => {
            const hash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
            return `https://www.gravatar.com/avatar/${hash}`;
        };
        // Format the response
        const authors = rows.map(row => ({
            id: row.ID,
            displayName: row.display_name,
            description: row.description || '',
            website: row.website || '',
            socialHandles: {
                facebook: row.facebook || '',
                instagram: row.instagram || '',
                linkedin: row.linkedin || '',
                tumblr: row.tumblr || '',
                twitter: row.twitter || '',
                youtube: row.youtube || '',
                wikipedia: row.wikipedia || '',
                pinterest: row.pinterest || ''
            },
            profileImage: getGravatarUrl(row.email)
        }));

        // Cache the response
        setCache(cacheKey, { authors });

        // Return the response
        res.status(200).json({ authors });
    } catch (error) {
        console.error('Database query error:', error); // Log the error for debugging
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export default handler;
