import { connectToDatabase } from '../../../lib/db';
import { getCache, setCache } from '../../../lib/cache';

const handler = async (req, res) => {
    const { method, query } = req;

    if (method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests are allowed' });
    }

    const { popular } = query;

    // Validate 'popular' parameter if present
    const popularCount = parseInt(popular, 10);
    if (!isNaN(popularCount) && popularCount < 1) {
        return res.status(400).json({ message: 'Invalid query parameter for popular categories' });
    }

    // Create a unique cache key based on the 'popular' parameter
    const cacheKey = `categories:${popular || 'all'}`;
    const cachedData = await getCache(cacheKey);

    if (cachedData) {
        return res.status(200).json(cachedData);
    }

    try {
        const connection = await connectToDatabase();

        // Fetch all categories with post counts of published posts
        const [rows] = await connection.execute(`
            SELECT 
                t.term_id as id, 
                t.name, 
                t.slug, 
                COUNT(DISTINCT tr.object_id) as post_count
            FROM 
                wp_terms t
            INNER JOIN 
                wp_term_taxonomy tt ON t.term_id = tt.term_id
            LEFT JOIN 
                wp_term_relationships tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
            LEFT JOIN 
                wp_posts p ON tr.object_id = p.ID AND p.post_status = 'publish'
            WHERE 
                tt.taxonomy = 'category'
            GROUP BY 
                t.term_id, t.name, t.slug
            ORDER BY 
                post_count DESC
        `);

        // Determine categories to return based on 'popular' parameter
        const categoriesToReturn = isNaN(popularCount) ? rows : rows.slice(0, popularCount);

        const response = {
            categories: categoriesToReturn
        };

        // Cache the response data
        await setCache(cacheKey, response);

        res.status(200).json(response);
    } catch (error) {
        console.error('Database query failed:', error); // Log error details
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export default handler;
