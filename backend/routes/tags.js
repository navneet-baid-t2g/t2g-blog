// routes/tags.js
const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { getCache, setCache } = require('../lib/cache');

/**
 * @swagger
 * /tags:
 *   get:
 *     tags:
 *       - Tags
 *     summary: Retrieve a list of tags
 *     responses:
 *       200:
 *         description: A list of tags
 *         schema:
 *           type: object
 *           properties:
 *             tags:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   term_id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   slug:
 *                     type: string
 *                   term_group:
 *                     type: integer
 *       500:
 *         description: Internal Server Error
 */
router.get('/', async (req, res) => {
  // Try to fetch cached data
  const cachedTags = getCache('tags');
  if (cachedTags) {
    return res.status(200).json({ tags: cachedTags });
  }

  try {

    // Fetch tags from the database
    const [rows] = await db.execute(`
         SELECT * 
         FROM wp_terms 
         WHERE term_id IN (
             SELECT term_id 
             FROM wp_term_taxonomy 
             WHERE taxonomy = 'post_tag'
         )
     `);

    // Cache the tags
    setCache('tags', rows);

    // Return the tags
    res.status(200).json({ tags: rows });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;
