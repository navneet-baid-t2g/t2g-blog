const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { getCache, setCache } = require('../lib/cache');
const crypto=require('crypto');

/**
 * @swagger
 * /authors:
 *   get:
 *     tags:
 *       - Authors
 *     summary: Retrieve a list of authors
 *     responses:
 *       200:
 *         description: A list of authors
 *         schema:
 *           type: object
 *           properties:
 *             authors:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   displayName:
 *                     type: string
 *                   description:
 *                     type: string
 *                   website:
 *                     type: string
 *                   socialHandles:
 *                     type: object
 *                     properties:
 *                       facebook:
 *                         type: string
 *                       instagram:
 *                         type: string
 *                       linkedin:
 *                         type: string
 *                       tumblr:
 *                         type: string
 *                       twitter:
 *                         type: string
 *                       youtube:
 *                         type: string
 *                       wikipedia:
 *                         type: string
 *                       pinterest:
 *                         type: string
 *                   profileImage:
 *                     type: string
 *       500:
 *         description: Internal Server Error
 */
router.get('/', async (req, res) => {
  // Generate a cache key based on the request
  const cacheKey = 'authors:all'; // Adjust if you use query parameters

  // Try to fetch cached data
  const cachedAuthors = getCache(cacheKey);
  if (cachedAuthors) {
    return res.status(200).json(cachedAuthors);
  }

  try {

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

    const [rows] = await db.execute(query);
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
});

/**
 * @swagger
 * /authors/{author_id}:
 *   get:
 *     tags:
 *       - Authors
 *     summary: Retrieve a specific author by ID
 *     parameters:
 *       - in: path
 *         name: author_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the author to retrieve
 *     responses:
 *       200:
 *         description: An author
 *         schema:
 *           type: object
 *           properties:
 *             authors:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   displayName:
 *                     type: string
 *                   description:
 *                     type: string
 *                   website:
 *                     type: string
 *                   socialHandles:
 *                     type: object
 *                     properties:
 *                       facebook:
 *                         type: string
 *                       instagram:
 *                         type: string
 *                       linkedin:
 *                         type: string
 *                       tumblr:
 *                         type: string
 *                       twitter:
 *                         type: string
 *                       youtube:
 *                         type: string
 *                       wikipedia:
 *                         type: string
 *                       pinterest:
 *                         type: string
 *                   profileImage:
 *                     type: string
 *       500:
 *         description: Internal Server Error
 */
router.get('/:author_id', async(req, res) => {
  const { author_id } = req.params;

  // Generate a cache key based on the author_id parameter
  const cacheKey = `authors:${author_id || 'all'}`;

  // Try to fetch cached data
  const cachedAuthors = getCache(cacheKey);
  if (cachedAuthors) {
      return res.status(200).json(cachedAuthors);
  }

  try {

      // Build the query with a WHERE clause if author_id is provided
      const queryStr = `
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
          ${author_id ? 'WHERE u.ID = ?' : ''}
          GROUP BY u.ID, u.display_name, u.user_url, u.user_email
      `;
  
      // Execute the query with the author_id parameter if it exists
      const [rows] = await db.execute(queryStr, author_id ? [author_id] : []);
      
      // Generate Gravatar URL
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
});

module.exports = router;
