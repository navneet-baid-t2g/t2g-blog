import Head from 'next/head';

// Helper function to generate breadcrumb items dynamically
const generateBreadcrumbs = (breadcrumbTitle, postUrl) => {
    const segments = breadcrumbTitle.split(' > ');
    return segments.map((segment, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": segment,
        "item": `${process.env.NEXT_PUBLIC_FRONTEND_URL}/${postUrl}`
    }));
};

const SeoHead = ({ yoastMeta, blog, author }) => {
    let openGraphImageMeta = JSON.parse(yoastMeta.open_graph_image_meta);
    if (openGraphImageMeta) {
        openGraphImageMeta = {
          url: openGraphImageMeta.url ? openGraphImageMeta.url : '',
          width: openGraphImageMeta.width ? openGraphImageMeta.width : '',
          height: openGraphImageMeta.height ? openGraphImageMeta.height : ''
        };
      } else {
        openGraphImageMeta = {
          url: "",
          width: "",
          height: ""
        };
      }
    
    const breadcrumbList = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": generateBreadcrumbs(yoastMeta.breadcrumb_title, blog.post_name)
    };

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${process.env.NEXT_PUBLIC_FRONTEND_URL}/${blog.post_name}`
        },
        "headline": yoastMeta.open_graph_title || blog.post_title,
        "description": yoastMeta.open_graph_description || blog.excerpt,
        "image": {
            "@type": "ImageObject",
            "url": openGraphImageMeta.url,
            "width": openGraphImageMeta.width,
            "height": openGraphImageMeta.height
        },
        "author": {
            "@type": "Person",
            "name": author.displayName || blog.author_name,
            "description": author.description,
            "url": author.website,
            "sameAs": Object.values(author.socialHandles).filter(Boolean)
        },
        "publisher": {
            "@type": "Organization",
            "name": "Blogging Site",
            "logo": {
                "@type": "ImageObject",
                "url": `${process.env.NEXT_PUBLIC_FRONTEND_URL}/images/version/garden-logo.png`,
                "width": 250,
                "height": 75
            }
        },
        "datePublished": blog.post_date,
        "dateModified": blog.post_modified
    };

    return (
        <Head>
            <title>{yoastMeta.title || `${blog.post_title}`}</title>
            <meta name="description" content={yoastMeta.description || blog.excerpt} />
            <meta name="keywords" content={yoastMeta.primary_focus_keyword} />
            <meta name="author" content={author.displayName || blog.author_name} />
            <meta name="robots" content={`${yoastMeta.is_robots_noindex ? 'noindex' : 'index'}, ${yoastMeta.is_robots_nofollow ? 'nofollow' : 'follow'}`} />
            {yoastMeta.is_robots_noarchive && <meta name="robots" content="noarchive" />}
            {yoastMeta.is_robots_noimageindex && <meta name="robots" content="noimageindex" />}
            {yoastMeta.is_robots_nosnippet && <meta name="robots" content="nosnippet" />}

            {/* Open Graph (OG) meta tags */}
            <meta property="og:title" content={yoastMeta.open_graph_title || blog.post_title} />
            <meta property="og:description" content={yoastMeta.open_graph_description || blog.excerpt} />
            <meta property="og:image" content={yoastMeta.open_graph_image || blog.thumbnail_url} />
            <meta property="og:url" content={`${process.env.NEXT_PUBLIC_FRONTEND_URL}/${blog.post_name}`} />
            <meta property="og:type" content="article" />
            <meta property="og:site_name" content="Blogging Site" />
            <meta property="article:published_time" content={blog.post_date} />
            <meta property="article:author" content={author.displayName || blog.author_name} />
            <meta property="article:section" content={blog.categories.map((category) => category.name).join(', ')} />
            <meta property="article:tag" content={blog.tags.map((tag) => tag.name).join(', ')} />

            {/* Twitter Card meta tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={yoastMeta.twitter_title || blog.post_title} />
            <meta name="twitter:description" content={yoastMeta.twitter_description || blog.excerpt} />
            <meta name="twitter:image" content={yoastMeta.twitter_image || blog.thumbnail_url} />

            {/* Canonical URL */}
            <link rel="canonical" href={yoastMeta.canonical || `${process.env.NEXT_PUBLIC_FRONTEND_URL}/${blog.post_name}`} />

            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }} />
        </Head>
    );
}

export default SeoHead;
