const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { getCache, setCache } = require('../lib/cache');
const Fuse = require('fuse.js');

/**
 * @swagger
 * /posts:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Get a list of posts with pagination
 *     description: Retrieve a list of published posts with their basic details, including Yoast metadata, categories, and tags. Results are paginated.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination (defaults to 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of posts per page (defaults to 10)
 *     responses:
 *       200:
 *         description: A list of posts with pagination details
 *       400:
 *         description: Invalid pagination parameters
 *       500:
 *         description: Internal Server Error
 */
router.get('/', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage < 1 || parsedLimit < 1) {
        return res.status(400).json({
            success: false,
            status: 400,
            message: 'Invalid pagination parameters',
        });
    }

    const offset = (parsedPage - 1) * parsedLimit;
    const cacheKey = `posts:${parsedPage}:${parsedLimit}:${offset}`;

    try {
        // Check cache first
        const cachedData = getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        // Fetch posts with basic details
        const [posts] = await db.query(
            `SELECT p.ID, p.post_author, p.post_date, p.post_modified, p.post_content, p.post_title, p.post_excerpt, p.post_status, p.comment_status, p.ping_status, p.post_name, p.comment_count,
                t.guid as thumbnail_url,
                u.display_name as author_name
         FROM wp_posts p
         LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
         LEFT JOIN wp_posts t ON pm.meta_value = t.ID AND t.post_type = 'attachment'
         LEFT JOIN wp_users u ON p.post_author = u.ID
         WHERE p.post_type = 'post' AND p.post_status = 'publish'
         ORDER BY p.post_date DESC
         LIMIT ? OFFSET ?`,
            [parsedLimit, offset]
        );

        // Fetch Yoast meta data
        const [yoastData] = await db.query(
            `SELECT 
           id, object_id, permalink, title, description, breadcrumb_title, is_public,canonical, primary_focus_keyword, is_robots_noindex, is_robots_nofollow, is_robots_noarchive, is_robots_noimageindex, is_robots_nosnippet, twitter_title, twitter_image,  twitter_description, open_graph_title, open_graph_description, open_graph_image, open_graph_image_meta, schema_article_type, schema_page_type
            FROM wp_yoast_indexable WHERE object_id IN (?) AND object_type = 'post' AND post_status = 'publish'`,
            [posts.map(post => post.ID)]
        );

        // Fetch total posts count
        const [[totalRows]] = await db.query(
            'SELECT COUNT(*) as total FROM wp_posts WHERE post_type = "post" AND post_status = "publish"'
        );

        const postIds = posts.map(post => post.ID);
        if (postIds.length === 0) {
            const response = {
                success: true,
                status: 200,
                data: {
                    posts: [],
                    pagination: {
                        page: parsedPage,
                        limit: parsedLimit,
                        totalPosts: 0,
                        totalPages: 0,
                    },
                },
            };
            setCache(cacheKey, response);
            return res.status(200).json(response);
        }

        const [categories] = await db.query(
            `SELECT p.ID, GROUP_CONCAT(CONCAT(cat_terms.name, ':', cat_terms.slug) SEPARATOR ', ') as categories
         FROM wp_term_relationships tr
         JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
         JOIN wp_terms cat_terms ON tt.term_id = cat_terms.term_id
         JOIN wp_posts p ON tr.object_id = p.ID
         WHERE p.ID IN (?) AND tt.taxonomy = 'category'
         GROUP BY p.ID`,
            [postIds]
        );

        const [tags] = await db.query(
            `SELECT p.ID, GROUP_CONCAT(tag_terms.name SEPARATOR ', ') as tags
         FROM wp_term_relationships tr
         JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
         JOIN wp_terms tag_terms ON tt.term_id = tag_terms.term_id
         JOIN wp_posts p ON tr.object_id = p.ID
         WHERE p.ID IN (?) AND tt.taxonomy = 'post_tag'
         GROUP BY p.ID`,
            [postIds]
        );

        const postsWithDetails = posts.map(post => {
            const categoryEntry = categories.find(cat => cat.ID === post.ID);
            const tagEntry = tags.find(tag => tag.ID === post.ID);
            const yoastMeta = yoastData.filter(meta => meta.object_id === post.ID);

            // Convert category string to array of objects with name and slug
            const categoryList = categoryEntry ? categoryEntry.categories.split(', ').map(cat => {
                const [name, slug] = cat.split(':');
                return { name, slug };
            }) : [];

            return {
                ...post,
                categories: categoryList,
                tags: tagEntry ? tagEntry.tags : '',
                yoastMeta
            };
        });

        const totalPosts = totalRows.total;
        const totalPages = Math.ceil(totalPosts / parsedLimit);

        const response = {
            success: true,
            status: 200,
            data: {
                posts: postsWithDetails,
                pagination: {
                    page: parsedPage,
                    limit: parsedLimit,
                    totalPosts,
                    totalPages,
                },
            },
        };

        // Cache the response data
        setCache(cacheKey, response);

        res.status(200).json(response);

    } catch (error) {
        console.error('Database query failed:', error);
        res.status(500).json({
            success: false,
            status: 500,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
});

/**
 * @swagger
 * /posts/comments:
 *   post:
 *     tags:
 *       - Posts
 *     summary: Submit a comment on a post
 *     description: Adds a comment to a specific post. Requires name, email, comment, and post ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the commenter
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 description: Email of the commenter
 *                 example: johndoe@example.com
 *               website:
 *                 type: string
 *                 description: Website of the commenter
 *                 example: http://johndoe.com
 *               comment:
 *                 type: string
 *                 description: The comment text
 *                 example: This is a sample comment.
 *               postId:
 *                 type: integer
 *                 description: ID of the post to comment on
 *                 example: 123
 *     responses:
 *       200:
 *         description: Comment submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment submitted successfully
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Name, email, comment, and post ID are required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post('/comments', async (req, res) => {
    try {
        const { name, email, website, comment, postId } = req.body; const express = require('express');
        const router = express.Router();
        const db = require('../lib/db');
        const { getCache, setCache } = require('../lib/cache');
        const Fuse = require('fuse.js');

        router.get('/', async (req, res) => {
            const { page = 1, limit = 10 } = req.query;
            const parsedPage = parseInt(page, 10);
            const parsedLimit = parseInt(limit, 10);

            if (isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage < 1 || parsedLimit < 1) {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: 'Invalid pagination parameters',
                });
            }

            const offset = (parsedPage - 1) * parsedLimit;
            const cacheKey = `posts:${parsedPage}:${parsedLimit}:${offset}`;

            try {
                // Check cache first
                const cachedData = getCache(cacheKey);
                if (cachedData) {
                    return res.status(200).json(cachedData);
                }

                // Fetch posts with basic details
                const [posts] = await db.query(
                    `SELECT p.ID, p.post_author, p.post_date, p.post_content, p.post_title, p.post_excerpt, p.post_status, p.comment_status, p.ping_status, p.post_name, p.comment_count,
                      t.guid as thumbnail_url,
                      u.display_name as author_name
               FROM wp_posts p
               LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
               LEFT JOIN wp_posts t ON pm.meta_value = t.ID AND t.post_type = 'attachment'
               LEFT JOIN wp_users u ON p.post_author = u.ID
               WHERE p.post_type = 'post' AND p.post_status = 'publish'
               ORDER BY p.post_date DESC
               LIMIT ? OFFSET ?`,
                    [parsedLimit, offset]
                );

                // Fetch total posts count
                const [[totalRows]] = await db.query(
                    'SELECT COUNT(*) as total FROM wp_posts WHERE post_type = "post" AND post_status = "publish"'
                );

                const postIds = posts.map(post => post.ID);
                if (postIds.length === 0) {
                    const response = {
                        success: true,
                        status: 200,
                        data: {
                            posts: [],
                            pagination: {
                                page: parsedPage,
                                limit: parsedLimit,
                                totalPosts: 0,
                                totalPages: 0,
                            },
                        },
                    };
                    setCache(cacheKey, response);
                    return res.status(200).json(response);
                }

                const [categories] = await db.query(
                    `SELECT p.ID, GROUP_CONCAT(cat_terms.name SEPARATOR ', ') as categories
               FROM wp_term_relationships tr
               JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
               JOIN wp_terms cat_terms ON tt.term_id = cat_terms.term_id
               JOIN wp_posts p ON tr.object_id = p.ID
               WHERE p.ID IN (?) AND tt.taxonomy = 'category'
               GROUP BY p.ID`,
                    [postIds]
                );

                const [tags] = await db.query(
                    `SELECT p.ID, GROUP_CONCAT(tag_terms.name SEPARATOR ', ') as tags
               FROM wp_term_relationships tr
               JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
               JOIN wp_terms tag_terms ON tt.term_id = tag_terms.term_id
               JOIN wp_posts p ON tr.object_id = p.ID
               WHERE p.ID IN (?) AND tt.taxonomy = 'post_tag'
               GROUP BY p.ID`,
                    [postIds]
                );

                // Check for Yoast SEO plugin availability
                const [yoastCheck] = await db.query(
                    `SELECT meta_key, meta_value
               FROM wp_postmeta
               WHERE meta_key LIKE '%yoast%' AND post_id IN (?)`,
                    [postIds]
                );

                const yoastMetaDataAvailable = yoastCheck.length > 0;

                const postsWithDetails = posts.map(post => {
                    const categoryEntry = categories.find(cat => cat.ID === post.ID);
                    const tagEntry = tags.find(tag => tag.ID === post.ID);
                    const yoastMeta = yoastMetaDataAvailable ?
                        yoastCheck.filter(meta => meta.post_id === post.ID) :
                        null;

                    return {
                        ...post,
                        categories: categoryEntry ? categoryEntry.categories : '',
                        tags: tagEntry ? tagEntry.tags : '',
                        yoastMeta: yoastMeta ? yoastMeta.reduce((acc, meta) => ({ ...acc, [meta.meta_key]: meta.meta_value }), {}) : null
                    };
                });

                const totalPosts = totalRows.total;
                const totalPages = Math.ceil(totalPosts / parsedLimit);

                const response = {
                    success: true,
                    status: 200,
                    data: {
                        posts: postsWithDetails,
                        pagination: {
                            page: parsedPage,
                            limit: parsedLimit,
                            totalPosts,
                            totalPages,
                        },
                    },
                };

                // Cache the response data
                setCache(cacheKey, response);

                res.status(200).json(response);

            } catch (error) {
                console.error('Database query failed:', error);
                res.status(500).json({
                    success: false,
                    status: 500,
                    message: 'Internal Server Error',
                    error: error.message,
                });
            }
        });



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

        // Use async/await for the query execution
        await db.query(query, values);

        return res.status(200).json({ message: 'Comment submitted successfully' });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /posts/recent:
 *   get:
 *     summary: Retrieve top 3 most recent posts
 *     tags: 
 *       - Posts
 *     description: Fetch the top 3 most recent published posts, including details like author, date, content, title, excerpt, status, thumbnail URL, author name, categories, and tags.
 *     responses:
 *       200:
 *         description: A list of the top 3 most recent posts
 *       500:
 *         description: Internal server error
 */
router.get('/recent', async (req, res) => {
    // Create a unique cache key for the request
    const cacheKey = 'top_posts:3';
    try {
        // Check cache first
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        // Fetch top 3 most recent posts
        const [rows] = await db.execute(
            `SELECT p.ID, p.post_author, p.post_date, p.post_modified, p.post_content, p.post_title, p.post_excerpt, p.post_status, p.post_name,
                    t.guid as thumbnail_url,
                    u.display_name as author_name,
                    GROUP_CONCAT(DISTINCT cat_terms.name SEPARATOR ', ') as categories,
                    GROUP_CONCAT(DISTINCT tag_terms.name SEPARATOR ', ') as tags
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
             LIMIT 3`
        );

        const response = {
            success: true,
            status: 200,
            data: {
                posts: rows,
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
});

/**
 * @swagger
 * /posts/related:
 *   get:
 *     summary: Retrieve posts related to a specific category
 *     tags: 
 *       - Posts
 *     description: Fetch the most recent posts related to a specific category, including details like author, date, content, title, excerpt, status, thumbnail URL, author name, categories, and tags.
 *     parameters:
 *       - in: query
 *         name: categoryName
 *         required: true
 *         description: The name of the category to fetch related posts for
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of the most recent posts related to the specified category
 *       400:
 *         description: Category Name is required
 *       500:
 *         description: Internal server error
 */
router.get('/related', async (req, res) => {
    const { categoryName } = req.query;

    if (!categoryName) {
        return res.status(400).json({
            success: false,
            status: 400,
            message: 'Category Name is required',
        });
    }

    // Create a unique cache key based on the categoryName
    const cacheKey = `recent-posts:${categoryName}`;
    const cachedData = await getCache(cacheKey);

    if (cachedData) {
        // Return the cached data
        return res.status(200).json(cachedData);
    }

    try {
            const [term] = await db.execute(`
                SELECT term_id
                FROM wp_terms
                WHERE name = ?
            `, [categoryName]);

            if (term.length === 0) {
                throw new Error('Category not found');
            }

            const termId = term[0].term_id;

            const [rows] = await db.execute(`
                SELECT p.ID, p.post_author, p.post_date, p.post_modified, p.post_content, p.post_title, p.post_excerpt, p.post_status, p.comment_status, p.ping_status, p.post_name, p.comment_count,  
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
                WHERE p.post_type = 'post' 
                AND p.post_status = 'publish'
                AND cat_tt.term_id = ?
                GROUP BY p.ID, p.post_title, p.post_content, p.post_date, pm.meta_value, t.guid, u.display_name
                ORDER BY p.post_date DESC
                LIMIT 2
            `, [termId]);




        const response = {
            success: true,
            status: 200,
            data: {
                posts: rows,
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
});

/**
 * @swagger
 * /posts/search:
 *   get:
 *     summary: Search posts by query
 *     tags: 
 *       - Posts
 *     description: Search for published posts based on a query parameter, including post title and excerpt.
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         description: The search query string
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of search results matching the query
 *       400:
 *         description: Query parameter is required
 *       500:
 *         description: Internal server error
 */
router.get('/search', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
    }

    // Generate a cache key based on the query parameter
    const cacheKey = `search:${query}`;

    // Try to fetch cached data
    const cachedResults = await getCache(cacheKey); // Ensure this returns a promise
    if (cachedResults) {
        return res.status(200).json({ results: cachedResults });
    }

    try {

        // Fetch all posts for searching
        const [rows] = await db.execute(`
            SELECT ID, post_title, post_excerpt, post_name AS slug
            FROM wp_posts
            WHERE post_type = 'post'
              AND post_status = 'publish'
        `);

        // Create a new Fuse instance
        const fuse = new Fuse(rows, {
            keys: ['post_title', 'post_excerpt'], // Keys to search in
            includeScore: true, // Include score to sort results by relevance
            threshold: 0.6, // Fuzzy search threshold (lower is more strict)
        });

        // Perform the search
        const result = fuse.search(query);

        // Cache the search results
        await setCache(cacheKey, result.map(({ item }) => item)); // Ensure this returns a promise

        // Return the search results
        res.status(200).json({ results: result.map(({ item }) => item) });

    } catch (error) {
        console.error('Database query error:', error); // Log the error for debugging
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }

});

/**
 * @swagger
 * /posts/author/{author_id}:
 *   get:
 *     summary: Get posts by author ID with pagination
 *     tags: 
 *       - Posts
 *     description: Retrieve published posts by a specific author with pagination support. Includes post details, author name, categories, and tags.
 *     parameters:
 *       - in: path
 *         name: author_id
 *         required: true
 *         description: ID of the author
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number for pagination (default is 1)
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of posts per page (default is 10)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of posts by the specified author with pagination details
 *       400:
 *         description: Invalid pagination parameters or missing author ID
 *       500:
 *         description: Internal server error
 */
router.get('/author/:author_id', async (req, res) => {
    const { author_id } = req.params;

    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1 || !author_id) {
        return res.status(400).json({
            success: false,
            status: 400,
            message: 'Invalid pagination parameters or missing author ID',
        });
    }

    const offset = (page - 1) * limit;
    const cacheKey = `posts:author:${author_id}:${page}:${limit}:${offset}`;

    try {
        // Check cache first
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        // Fetch posts by author ID
        const [posts] = await db.execute(
            `SELECT p.ID, p.post_author, p.post_date, p.post_modified, p.post_content, p.post_title, p.post_excerpt, p.post_status, p.comment_status, p.ping_status, p.post_name, p.comment_count,
                    t.guid as thumbnail_url,
                    u.display_name as author_name
             FROM wp_posts p
             LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
             LEFT JOIN wp_posts t ON pm.meta_value = t.ID AND t.post_type = 'attachment'
             LEFT JOIN wp_users u ON p.post_author = u.ID
             WHERE p.post_type = 'post' AND p.post_status = 'publish' AND p.post_author = ?
             ORDER BY p.post_date DESC
             LIMIT ${limit} OFFSET ${offset}`,
            [author_id]
        );
        // Fetch Yoast meta data
        const [yoastData] = await db.query(
            `SELECT 
                id, object_id, permalink, title, description, breadcrumb_title, is_public,canonical, primary_focus_keyword, is_robots_noindex, is_robots_nofollow, is_robots_noarchive, is_robots_noimageindex, is_robots_nosnippet, twitter_title, twitter_image,  twitter_description, open_graph_title, open_graph_description, open_graph_image, open_graph_image_meta, schema_article_type, schema_page_type
                FROM wp_yoast_indexable WHERE object_id IN (?) AND object_type = 'post' AND post_status = 'publish'`,
            [posts.map(post => post.ID)]
        );
        // Fetch total posts count for the author
        const [totalRows] = await db.execute(
            `SELECT COUNT(*) as total
             FROM wp_posts
             WHERE post_type = 'post' AND post_status = 'publish' AND post_author = ?`,
            [author_id]
        );

        // Fetch categories and tags with slugs
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

        const [categoriesRows] = await db.execute(
            `SELECT p.ID, GROUP_CONCAT(DISTINCT CONCAT(cat_terms.name, ':', cat_terms.slug) SEPARATOR ', ') as categories
             FROM wp_term_relationships tr
             JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
             JOIN wp_terms cat_terms ON tt.term_id = cat_terms.term_id
             JOIN wp_posts p ON tr.object_id = p.ID
             WHERE p.ID IN (${postIds.join(',')}) AND tt.taxonomy = 'category'
             GROUP BY p.ID`
        );

        const [tagsRows] = await db.execute(
            `SELECT p.ID, GROUP_CONCAT(DISTINCT CONCAT(tag_terms.name, ':', tag_terms.slug) SEPARATOR ', ') as tags
             FROM wp_term_relationships tr
             JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
             JOIN wp_terms tag_terms ON tt.term_id = tag_terms.term_id
             JOIN wp_posts p ON tr.object_id = p.ID
             WHERE p.ID IN (${postIds.join(',')}) AND tt.taxonomy = 'post_tag'
             GROUP BY p.ID`,
        );

        // Combine posts with their categories and tags
        const postsWithDetails = posts.map(post => {
            const categoryEntry = categoriesRows.find(cat => cat.ID === post.ID);
            const tagEntry = tagsRows.find(tag => tag.ID === post.ID);
            const yoastMeta = yoastData.filter(meta => meta.object_id === post.ID);
            return {
                ...post,
                categories: categoryEntry ? categoryEntry.categories.split(', ').map(cat => {
                    const [name, slug] = cat.split(':');
                    return { name, slug };
                }) : [],
                tags: tagEntry ? tagEntry.tags.split(', ').map(tag => {
                    const [name, slug] = tag.split(':');
                    return { name, slug };
                }) : [],
                yoastMeta
            };
        });

        const totalPosts = totalRows[0].total;
        const totalPages = Math.ceil(totalPosts / limit);

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
        await setCache(cacheKey, response);

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
});

/**
 * @swagger
 * /posts/category/{category_slug}:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Retrieve posts by category with pagination
 *     description: Retrieve posts from a specified category with pagination. Optionally, filter by category slug.
 *     parameters:
 *       - in: path
 *         name: category_slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Slug of the category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *         description: Number of posts per page
 *     responses:
 *       200:
 *         description: Successfully retrieved posts
 *       400:
 *         description: Invalid pagination parameters
 *       500:
 *         description: Internal Server Error
 */
router.get('/category/:category_slug', async (req, res) => {
    const { category_slug } = req.params;

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
    const cacheKey = `posts:${page}:${limit}:${offset}:${category_slug || ''}`;

    try {
        // Check cache first
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json(cachedData);
        }


        // Base query for fetching posts
        let query = `
            SELECT p.ID, p.post_author, p.post_date, p.post_modified, p.post_content, p.post_title, p.post_excerpt, p.post_status, p.comment_status, p.ping_status, p.post_name, p.comment_count,
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

        const [posts] = await db.execute(query, values);

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

        const [totalRows] = await db.execute(countQuery, category_slug ? [category_slug] : []);
        const totalPosts = totalRows[0].total;
        const totalPages = Math.ceil(totalPosts / limit);
        // Fetch Yoast meta data
        const [yoastData] = await db.query(
            `SELECT 
                id, object_id, permalink, title, description, breadcrumb_title, is_public,canonical, primary_focus_keyword, is_robots_noindex, is_robots_nofollow, is_robots_noarchive, is_robots_noimageindex, is_robots_nosnippet, twitter_title, twitter_image,  twitter_description, open_graph_title, open_graph_description, open_graph_image, open_graph_image_meta, schema_article_type, schema_page_type
                FROM wp_yoast_indexable WHERE object_id IN (?) AND object_type = 'post' AND post_status = 'publish'`,
            [posts.map(post => post.ID)]
        );
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

        const [categories] = await db.execute(
            `SELECT p.ID, GROUP_CONCAT(CONCAT(cat_terms.name, ':', cat_terms.slug) SEPARATOR ', ') as categories
             FROM wp_term_relationships tr
             JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
             JOIN wp_terms cat_terms ON tt.term_id = cat_terms.term_id
             JOIN wp_posts p ON tr.object_id = p.ID
             WHERE p.ID IN (${postIds.join(',')}) AND tt.taxonomy = 'category'
             GROUP BY p.ID`
        );

        const [tags] = await db.execute(
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
            const yoastMeta = yoastData.filter(meta => meta.object_id === post.ID);
            const categoriesList = categoryEntry ? categoryEntry.categories.split(', ').map(cat => {
                const [name, slug] = cat.split(':');
                return { name, slug };
            }) : [];
            return {
                ...post,
                categories: categoriesList,
                tags: tagEntry ? tagEntry.tags : '',
                yoastMeta
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
});

/**
 * @swagger
 * /posts/{slug}:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Retrieve a post by slug
 *     description: Retrieve a post and its associated categories, tags, Yoast meta data, and comments by the post's slug.
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Slug of the post
 *     responses:
 *       200:
 *         description: Successfully retrieved post
 *       400:
 *         description: Missing slug parameter
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/:slug', async (req, res) => {
    const { slug } = req.params;

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
        // Fetch the post by slug with parameterized query
        const [postRows] = await db.execute(`
            SELECT 
                p.ID,
                p.post_author,
                p.post_date,
                p.post_modified,
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

        // Fetch Yoast meta data
        const [yoastMeta] = await db.query(
            `SELECT 
           id, object_id, permalink, title, description, breadcrumb_title, is_public,canonical, primary_focus_keyword, is_robots_noindex, is_robots_nofollow, is_robots_noarchive, is_robots_noimageindex, is_robots_nosnippet, twitter_title, twitter_image,  twitter_description, open_graph_title, open_graph_description, open_graph_image, open_graph_image_meta, schema_article_type, schema_page_type
            FROM wp_yoast_indexable WHERE object_id = ? AND object_type = 'post' AND post_status = 'publish'`,
            [post.ID]
        );

        // Fetch categories and tags
        const [categoriesRows] = await db.execute(`
            SELECT 
                cat_terms.name AS category_name, 
                cat_terms.slug AS category_slug
            FROM wp_term_relationships tr
            JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id AND tt.taxonomy = 'category'
            JOIN wp_terms cat_terms ON tt.term_id = cat_terms.term_id
            WHERE tr.object_id = ?
        `, [post.ID]);

        const [tagsRows] = await db.execute(`
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
        const [commentsRows] = await db.execute(`
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
                yoastMeta
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
});

module.exports = router;
