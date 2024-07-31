import axios from 'axios';

const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

const generateSiteMap = (posts) => {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${posts
            .map((post) => {
                return `
            <url>
              <loc>${siteUrl}/${post.post_name}</loc>
              <lastmod>${new Date(post.post_modified).toISOString()}</lastmod>
              <priority>1.0</priority>
            </url>
          `;
            })
            .join('')}
    </urlset>
  `;
};

const fetchAllPosts = async () => {
    const posts = [];
    let page = 1;
    let limit = 10; // Default limit value, can be adjusted based on your API

    while (true) {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts?page=${page}&limit=${limit}`);

        const fetchedPosts = response.data.data.posts;
        const pagination = response.data.data.pagination;

        posts.push(...fetchedPosts);

        if (page >= pagination.totalPages) {
            break;
        }

        page++;
    }

    return posts;
};

export async function getServerSideProps({ res }) {
    try {
        const posts = await fetchAllPosts();
        if (!posts) {
            return {
                notFound: true,
            };
        }

        const sitemap = generateSiteMap(posts);

        res.setHeader('Content-Type', 'text/xml');
        res.write(sitemap);
        res.end();

        return {
            props: {},
        };
    } catch (error) {
        console.error('Error generating sitemap:', error);

        return {
            notFound: true,
        };
    }
}

export default function Sitemap() {
    return null;
}
