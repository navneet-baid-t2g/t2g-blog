// pages/api/posts.js
import { connectToDatabase } from '../../lib/db';

const handler = async (req, res) => {
    const { method } = req;

    if (method !== 'GET') {
        return res.status(405).json({
            success: false,
            status: 405,
            message: 'Only GET requests are allowed',
        });
    }

    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
        return res.status(400).json({
            success: false,
            status: 400,
            message: 'Invalid pagination parameters',
        });
    }

    const offset = (page - 1) * limit;

    try {
        const connection = await connectToDatabase();

        // Fetch posts with basic details
        const [posts] = await connection.execute(
            `SELECT p.*, 
                    pm.meta_value as thumbnail_id, 
                    t.guid as thumbnail_url,
                    u.display_name as author_name
             FROM wp_posts p
             LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
             LEFT JOIN wp_posts t ON pm.meta_value = t.ID AND t.post_type = 'attachment'
             LEFT JOIN wp_users u ON p.post_author = u.ID
             WHERE p.post_type = 'post' AND p.post_status = 'publish'
              ORDER BY p.post_date DESC
             LIMIT ? OFFSET ?`, [limit, offset]
        );

        // Fetch total posts count
        const [totalRows] = await connection.execute(
            'SELECT COUNT(*) as total FROM wp_posts WHERE post_type = "post" AND post_status = "publish"'
        );

        // Fetch categories and tags separately
        const postIds = posts.map(post => post.ID);
        const [categories] = await connection.execute(
            `SELECT p.ID, GROUP_CONCAT(cat_terms.name SEPARATOR ', ') as categories
             FROM wp_term_relationships tr
             JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
             JOIN wp_terms cat_terms ON tt.term_id = cat_terms.term_id
             JOIN wp_posts p ON tr.object_id = p.ID
             WHERE p.ID IN (?) AND tt.taxonomy = 'category'
             GROUP BY p.ID`, [postIds]
        );

        const [tags] = await connection.execute(
            `SELECT p.ID, GROUP_CONCAT(tag_terms.name SEPARATOR ', ') as tags
             FROM wp_term_relationships tr
             JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
             JOIN wp_terms tag_terms ON tt.term_id = tag_terms.term_id
             JOIN wp_posts p ON tr.object_id = p.ID
             WHERE p.ID IN (?) AND tt.taxonomy = 'post_tag'
             GROUP BY p.ID`, [postIds]
        );

        // Combine posts with their categories and tags
        const postsWithDetails = posts.map(post => {
            const categoryEntry = categories.find(cat => cat.ID === post.ID);
            const tagEntry = tags.find(tag => tag.ID === post.ID);
            return {
                ...post,
                thumbnail_id: post.thumbnail_id,
                thumbnail_url: post.thumbnail_url,
                author_name: post.author_name,
                categories: categoryEntry ? categoryEntry.categories : '',
                tags: tagEntry ? tagEntry.tags : ''
            };
        });

        const totalPosts = totalRows[0].total;
        const totalPages = Math.ceil(totalPosts / limit);

        res.status(200).json({
            success: true,
            status: 200,
            data: {
                posts: postsWithDetails,
                pagination: {
                    page,
                    limit,
                    totalPosts,
                    totalPages,
                },
            },
        });

        await connection.end();
    } catch (error) {
        console.error('Database query failed:', error); // Log error details
        res.status(500).json({
            success: false,
            status: 500,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
};

export default (handler);
