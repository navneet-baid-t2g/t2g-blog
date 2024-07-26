import { connectToDatabase } from '../../lib/db';
import { apiKeyAuthMiddleware } from '../../lib/auth';

const handler = async (req, res) => {
    const { method } = req;

    if (method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests are allowed' });
    }

    try {
        const { popular } = req.query;

        const connection = await connectToDatabase();

        // Fetch all categories with post counts of published posts
        const [rows] = await connection.execute(`
            SELECT 
                t.term_id as id, 
                t.name, 
                t.slug, 
                COUNT(tr.object_id) as post_count
            FROM 
                wp_terms t
            INNER JOIN 
                wp_term_taxonomy tt ON t.term_id = tt.term_id
            LEFT JOIN 
                wp_term_relationships tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
            LEFT JOIN 
                wp_posts p ON tr.object_id = p.ID
            WHERE 
                tt.taxonomy = 'category' AND p.post_status = 'publish'
            GROUP BY 
                t.term_id, t.name, t.slug
            ORDER BY 
                post_count DESC
        `);

        await connection.end();


        const allCategories = rows;

        // Return top categories if 'popular' query parameter is present, else return all categories
        if (popular) {
            // Separate top popular categories and the rest
            const topCategories = rows.slice(0, popular);
            return res.status(200).json({ categories: topCategories });
        } else {
            return res.status(200).json({ categories: allCategories });
        }
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export default apiKeyAuthMiddleware(handler);
