const express = require('express');
const router = express.Router();

const db = require('../lib/db');
const { getCache, setCache } = require('../lib/cache');

/**
 * @swagger
 * /categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Retrieve a list of categories
 *     parameters:
 *       - in: query
 *         name: popular
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Limit to top N popular categories based on post count
 *     responses:
 *       200:
 *         description: A list of categories
 *         examples:
 *           application/json:
*               categories:
*                 - id: 1
*                   name: "Category 1"
*                   slug: "category-1"
*                   post_count: 10
*                 - id: 2
*                   name: "Category 2"
*                   slug: "category-2"
*                   post_count: 5
 *       400:
 *         description: Invalid query parameter for popular categories
 *         examples:
 *           application/json:
 *             message: "Invalid query parameter for popular categories"
 *       500:
 *         description: Internal Server Error
 *         examples:
 *           application/json:
 *             message: "Internal Server Error"
 *             error: "Detailed error message"
 */
router.get('/', async(req, res) => {
  const { popular } = req.query;

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

      // Fetch all categories with post counts of published posts
      const [rows] = await db.execute(`
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
      setCache(cacheKey, response);

      res.status(200).json(response);
  } catch (error) {
      console.error('Database query failed:', error); // Log error details
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;
