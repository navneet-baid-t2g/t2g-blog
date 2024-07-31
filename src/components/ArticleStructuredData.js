import Head from 'next/head';

const ArticleStructuredData = ({ yoastMeta, blog }) => {
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
      "url": openGraphImageMeta.url || '',
      "width": openGraphImageMeta.width || '',
      "height": openGraphImageMeta.height || ''
    },
    "author": {
      "@type": "Person",
      "name": blog.author_name
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </Head>
  );
};

export default ArticleStructuredData;
