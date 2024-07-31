import { connectToDatabase } from '../../../lib/db';
import { getCache, setCache } from '../../../lib/cache'; // Import cache functions

const handler = async (req, res) => {
    const { method, query } = req;

    if (method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests are allowed' });
    }

    const { slug } = query;

    if (!slug) {
        return res.status(400).json({ message: 'Missing slug parameter' });
    }

    // Generate a cache key based on the slug parameter
    const cacheKey = `post:${slug}`;

    // Try to fetch cached data
    const cachedPost = await getCache(cacheKey); // Ensure this returns a promise
    if (cachedPost) {
        return res.status(200).json(cachedPost);
    }

    try {
        const connection = await connectToDatabase();

        // Fetch the post by slug with parameterized query
        const [postRows] = await connection.execute(`
            SELECT 
                p.ID,
                p.post_author,
                p.post_date,
                p.post_content,
                p.post_title,
                p.post_excerpt,
                p.post_status,
                p.comment_status,
                p.ping_status,
                p.post_name,
                p.post_type,
                p.comment_count,
                MAX(pm.meta_value) AS thumbnail_id, 
                MAX(t.guid) AS thumbnail_url,
                MAX(u.display_name) AS author_name
            FROM wp_posts p
            LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
            LEFT JOIN wp_posts t ON pm.meta_value = t.ID AND t.post_type = 'attachment'
            LEFT JOIN wp_users u ON p.post_author = u.ID
            WHERE p.post_name = ? AND p.post_type = 'post' AND p.post_status = 'publish'
            GROUP BY p.ID
        `, [slug]);

        if (postRows.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const post = postRows[0];

        // Fetch categories and tags
        const [categoriesRows] = await connection.execute(`
            SELECT 
                cat_terms.name AS category_name, 
                cat_terms.slug AS category_slug
            FROM wp_term_relationships tr
            JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id AND tt.taxonomy = 'category'
            JOIN wp_terms cat_terms ON tt.term_id = cat_terms.term_id
            WHERE tr.object_id = ?
        `, [post.ID]);

        const [tagsRows] = await connection.execute(`
            SELECT 
                tag_terms.name AS tag_name, 
                tag_terms.slug AS tag_slug
            FROM wp_term_relationships tr
            JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id AND tt.taxonomy = 'post_tag'
            JOIN wp_terms tag_terms ON tt.term_id = tag_terms.term_id
            WHERE tr.object_id = ?
        `, [post.ID]);

        // Prepare the categories and tags arrays
        const categories = categoriesRows.map(row => ({
            name: row.category_name,
            slug: row.category_slug,
        }));

        const tags = tagsRows.map(row => ({
            name: row.tag_name,
            slug: row.tag_slug,
        }));

        // Fetch comments for the post
        const [commentsRows] = await connection.execute(`
            SELECT 
                c.comment_ID,
                c.comment_post_ID,
                c.comment_author,
                c.comment_author_email,
                c.comment_author_url,
                c.comment_date,
                c.comment_date_gmt,
                c.comment_content,
                c.comment_karma,
                c.comment_approved
            FROM wp_comments c
            WHERE c.comment_post_ID = ? AND c.comment_approved = '1'
            ORDER BY c.comment_date ASC
        `, [post.ID]);

        // Prepare the response
        const response = {
            post: {
                ...post,
                categories,
                tags,
            },
            comments: commentsRows,
        };

        // Cache the response
        setCache(cacheKey, response); // Ensure this returns a promise

        // Return the response
        res.status(200).json(response);

    } catch (error) {
        console.error('Database query error:', error); // Log the error for debugging
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export default handler;
