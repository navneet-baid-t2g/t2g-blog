import { connectToDatabase } from '../../../lib/db';
import { apiKeyAuthMiddleware } from '../../../lib/auth'; // Ensure this is used if needed

const formatDateForSQL = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const handler = async (req, res) => {
    const { method, query } = req;

    if (method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests are allowed' });
    }

    const { slug } = query;

    if (!slug) {
        return res.status(400).json({ message: 'Missing slug parameter' });
    }

    try {
        const connection = await connectToDatabase();

        // Fetch the post by slug with parameterized query
        const [postRows] = await connection.execute(`
            SELECT 
                p.ID,
                p.post_author,
                p.post_date,
                p.post_date_gmt,
                p.post_content,
                p.post_title,
                p.post_excerpt,
                p.post_status,
                p.comment_status,
                p.ping_status,
                p.post_password,
                p.post_name,
                p.to_ping,
                p.pinged,
                p.post_modified,
                p.post_modified_gmt,
                p.post_content_filtered,
                p.post_parent,
                p.guid,
                p.menu_order,
                p.post_type,
                p.post_mime_type,
                p.comment_count,
                MAX(pm.meta_value) AS thumbnail_id, 
                MAX(t.guid) AS thumbnail_url,
                MAX(u.display_name) AS author_name,
                GROUP_CONCAT(DISTINCT cat_terms.name) AS categories,
                GROUP_CONCAT(DISTINCT tag_terms.name) AS tags
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
            WHERE p.post_name = ? AND p.post_type = 'post' AND p.post_status = 'publish'
            GROUP BY 
                p.ID,
                p.post_author,
                p.post_date,
                p.post_date_gmt,
                p.post_content,
                p.post_title,
                p.post_excerpt,
                p.post_status,
                p.comment_status,
                p.ping_status,
                p.post_password,
                p.post_name,
                p.to_ping,
                p.pinged,
                p.post_modified,
                p.post_modified_gmt,
                p.post_content_filtered,
                p.post_parent,
                p.guid,
                p.menu_order,
                p.post_type,
                p.post_mime_type,
                p.comment_count
        `, [slug]);

        if (postRows.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const post = postRows[0];

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

        // Ensure connection is released properly
        await connection.end();

        res.status(200).json({
            post: {
                ...post,
                categories: post.categories ? post.categories.split(',') : [],
                tags: post.tags ? post.tags.split(',') : [],
            },
            comments: commentsRows,
        });
    } catch (error) {
        console.error('Database query error:', error); // Log the error for debugging
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export default handler;
