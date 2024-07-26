// pages/api/posts.js
import { connectToDatabase } from '../../../lib/db';

const handler = async (req, res) => {
    const { method } = req;

    if (method !== 'GET') {
        return res.status(405).json({
            success: false,
            status: 405,
            message: 'Only GET requests are allowed',
        });
    }

    try {
        const connection = await connectToDatabase();

        // Query to fetch the top 3 most recent posts
        const [rows] = await connection.execute(
            `SELECT p.*, 
                    pm.meta_value as thumbnail_id, 
                    t.guid as thumbnail_url,
                    u.display_name as author_name,
                    GROUP_CONCAT(DISTINCT cat_terms.name) as categories,
                    GROUP_CONCAT(DISTINCT tag_terms.name) as tags
             FROM wp_posts p
             LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
             LEFT JOIN wp_posts t ON pm.meta_value = t.ID AND t.post_type = 'attachment'
             LEFT JOIN wp_users u ON p.post_author = u.ID
             LEFT JOIN wp_term_relationships cat_tr ON p.ID = cat_tr.object_id
             LEFT JOIN wp_term_taxonomy cat_tt ON cat_tr.term_taxonomy_id = cat_tt.term_taxonomy_id AND cat_tt.taxonomy = 'category'
             LEFT JOIN wp_terms cat_terms ON cat_tt.term_id = cat_terms.term_id
             LEFT JOIN wp_term_relationships tag_tr ON p.ID = tag_tr.object_id
             LEFT JOIN wp_term_taxonomy tag_tt ON tag_tr.term_taxonomy_id = tag_tt.term_taxonomy_id AND tag_tt.taxonomy = 'post_tag'
             LEFT JOIN wp_terms tag_terms ON tag_tt.term_id = tag_terms.term_id
             WHERE p.post_type = 'post' AND p.post_status = 'publish'
             GROUP BY p.ID, p.post_title, p.post_content, p.post_date, pm.meta_value, t.guid, u.display_name
             ORDER BY p.post_date DESC
             LIMIT 3`  // Always fetch the top 3 posts
        );

        await connection.end();

        res.status(200).json({
            success: true,
            status: 200,
            data: {
                posts: rows,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 500,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
};

export default handler;
