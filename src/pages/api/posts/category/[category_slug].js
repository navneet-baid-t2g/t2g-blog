import { connectToDatabase } from '../../../../lib/db';
import { getCache, setCache } from '../../../../lib/cache';

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            status: 405,
            message: 'Only GET requests are allowed',
        });
    }

    let { page = 1, limit = 10, category_slug } = req.query;
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
    const cacheKey = `posts:${page}:${limit}:${offset}:${category_slug || ''}`;

    try {
        // Check cache first
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        const connection = await connectToDatabase();

        // Base query for fetching posts
        let query = `
            SELECT p.ID, p.post_author, p.post_date, p.post_content, p.post_title, p.post_excerpt, p.post_status, p.comment_status, p.ping_status, p.post_name, p.comment_count,
                   MAX(t.guid) as thumbnail_url, MAX(u.display_name) as author_name
            FROM wp_posts p
            LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
            LEFT JOIN wp_posts t ON pm.meta_value = t.ID AND t.post_type = 'attachment'
            LEFT JOIN wp_users u ON p.post_author = u.ID
            LEFT JOIN wp_term_relationships tr ON p.ID = tr.object_id
            LEFT JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
            LEFT JOIN wp_terms cat_terms ON tt.term_id = cat_terms.term_id
            WHERE p.post_type = 'post' AND p.post_status = 'publish'
        `;

        // Filter by category slug if provided
        if (category_slug) {
            query += `
                AND cat_terms.slug = ?
            `;
        }

        query += `
            GROUP BY p.ID
            ORDER BY p.post_date DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const values = category_slug ? [category_slug] : [];

        const [posts] = await connection.execute(query, values);

        // Fetch total posts count
        let countQuery = `
            SELECT COUNT(*) as total
            FROM wp_posts p
            LEFT JOIN wp_term_relationships tr ON p.ID = tr.object_id
            LEFT JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
            LEFT JOIN wp_terms cat_terms ON tt.term_id = cat_terms.term_id
            WHERE p.post_type = 'post' AND p.post_status = 'publish'
        `;

        // Add filter for category slug
        if (category_slug) {
            countQuery += ` AND cat_terms.slug = ?`;
        }

        const [totalRows] = await connection.execute(countQuery, category_slug ? [category_slug] : []);
        const totalPosts = totalRows[0].total;
        const totalPages = Math.ceil(totalPosts / limit);

        // Fetch categories and tags
        const postIds = posts.map(post => post.ID);
        if (postIds.length === 0) {
            const response = {
                success: true,
                status: 200,
                data: {
                    posts: [],
                    pagination: {
                        page,
                        limit,
                        totalPosts: 0,
                        totalPages: 0,
                    },
                },
            };
            setCache(cacheKey, response);
            return res.status(200).json(response);
        }

        const [categories] = await connection.execute(
            `SELECT p.ID, GROUP_CONCAT(CONCAT(cat_terms.name, ':', cat_terms.slug) SEPARATOR ', ') as categories
             FROM wp_term_relationships tr
             JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
             JOIN wp_terms cat_terms ON tt.term_id = cat_terms.term_id
             JOIN wp_posts p ON tr.object_id = p.ID
             WHERE p.ID IN (${postIds.join(',')}) AND tt.taxonomy = 'category'
             GROUP BY p.ID`
        );

        const [tags] = await connection.execute(
            `SELECT p.ID, GROUP_CONCAT(tag_terms.name SEPARATOR ', ') as tags
             FROM wp_term_relationships tr
             JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
             JOIN wp_terms tag_terms ON tt.term_id = tag_terms.term_id
             JOIN wp_posts p ON tr.object_id = p.ID
             WHERE p.ID IN (${postIds.join(',')}) AND tt.taxonomy = 'post_tag'
             GROUP BY p.ID`,
        );

        // Combine posts with their categories and tags
        const postsWithDetails = posts.map(post => {
            const categoryEntry = categories.find(cat => cat.ID === post.ID);
            const tagEntry = tags.find(tag => tag.ID === post.ID);
            const categoriesList = categoryEntry ? categoryEntry.categories.split(', ').map(cat => {
                const [name, slug] = cat.split(':');
                return { name, slug };
            }) : [];
            return {
                ...post,
                categories: categoriesList,
                tags: tagEntry ? tagEntry.tags : ''
            };
        });

        const response = {
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
        };

        // Cache the response data
        setCache(cacheKey, response);

        res.status(200).json(response);

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

export default handler;
