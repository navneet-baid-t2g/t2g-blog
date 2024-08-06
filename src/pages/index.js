import Script from 'next/script';
import Head from 'next/head';
import Searchbar from "@/components/searchbar";
import TopBar from "@/components/topbar";
import LogoHeader from "@/components/LogoHeader";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Top3Posts from "@/components/Top3Posts";
import Sidebar from "@/components/Sidebar";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import React from 'react';
import axios from 'axios';
import Image from 'next/image';
import ArticleStructuredData from '@/components/ArticleStructuredData';
const HomePage = ({ initialPosts, initialPagination, categories, recentPostsData }) => {
  const [posts, setPosts] = useState(initialPosts);
  const [pagination, setPagination] = useState(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const componentsToShow = [
    'SearchBar',
    'RecentPosts',
    'Advertising',
    'Instafeed',
    'PopularCategories'
  ];

  const fetchPosts = async (page) => {
    setLoading(true);
    try {
      const apiKey = 'test'; // Replace with your actual API key
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts?page=${page}`, {
        headers: {
          'x-api-key': apiKey,
        },
      });
      const data = await response.json();

      if (data.success) {
        setPosts(data.data.posts);
        setPagination(data.data.pagination);
        setCurrentPage(data.data.pagination.page);
      } else {
        console.error('Failed to fetch posts:', data.message);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
    setLoading(false);
  };



  const handlePageChange = (page) => {
    if (page !== currentPage) {
      setCurrentPage(page);
      fetchPosts(page);
    }
    console.log(page)
  };


  return (
    <>
      <Head>
        <title>Blogging Site - Home</title>
        <meta name="description" content="Welcome to our blogging site where you can read the latest articles on various topics." />
        <meta name="keywords" content="blog, articles, news, tech, lifestyle, fashion" />
        <meta name="author" content="Blogging Site" />
        <meta property="og:title" content="Blogging Site - Home" />
        <meta property="og:description" content="Welcome to our blogging site where you can read the latest articles on various topics." />
        <meta property="og:image" content="/images/version/garden-footer-logo.png" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_FRONTEND_URL}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blogging Site - Home" />
        <meta name="twitter:description" content="Welcome to our blogging site where you can read the latest articles on various topics." />
        <meta name="twitter:image" content="/images/version/garden-footer-logo.png" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_FRONTEND_URL}`} />
      </Head>
      <div id="wrapper">
        <Searchbar />
        <TopBar />
        <LogoHeader />
        {/* <Header /> */}
        {/* <Top3Posts /> */}

        <section className="section wb">
          <div className="container">
            <div className="row">
              <BlogList
                posts={posts}
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
              />
              <Sidebar components={componentsToShow} categories={categories} recentPostsData={recentPostsData} />
            </div>{/* end row */}
          </div>{/* end container */}
        </section>
        <Footer />
        <ScrollToTop />
      </div>{/* end wrapper */}
    </>
  );
};

const BlogList = ({ posts, pagination, onPageChange, loading }) => {
  return (
    <div className="col-lg-9 col-md-12 col-sm-12 col-xs-12">
      <div className="page-wrapper">
        <div className="blog-list clearfix">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {posts.map((post) => (
                <React.Fragment key={post.ID}>
                  <ArticleStructuredData yoastMeta={post.yoastMeta[0]} blog={post} />
                  <div className="blog-box row">
                    {post.thumbnail_url &&
                      <div className="col-md-4">
                        <div className="post-media">
                          <Link href={`/${post.post_name}`} passHref>

                            <Image
                              src={post.thumbnail_url}
                              alt={post.post_title}
                              // layout="responsive"
                              width={0} 
                              height={0}
                              className="img-fluid"
                              loading='lazy'
                            />
                            <div className="hovereffect" />

                          </Link>
                        </div>
                      </div>
                    }
                    <div className={post.thumbnail_url !== "" ? 'blog-meta big-meta col-md-8' : 'blog-meta big-meta col-md-12'}>
                      <span className="bg-aqua" style={{ display: 'inline', padding: '0 0.2rem', background: '#C01F29 !important', borderRadius: '5px' }}>
                        {post.categories.map((category, index) => (
                          <a href={`/category/${category.slug}`} title={category.name} style={{ padding: '0 0.2rem' }}>
                            {category.name} {index < post.categories.length - 1 && ', '}

                          </a>
                        ))}
                      </span>
                      <h4>
                        <Link href={`/${post.post_name}`} title>
                          {post.post_title}
                        </Link>
                      </h4>
                      <p>{post.post_excerpt}</p>
                      <small>
                        <i className="fa fa-comment-o" /> {post.comment_count}

                      </small>
                      <small>

                        {format(new Date(post.post_date), 'MMMM d, yyyy')}

                      </small>
                      <small>
                        <Link href={`/author/${post.post_author}`} title>
                          by {post.author_name}
                        </Link>
                      </small>
                    </div>
                  </div>
                  <hr className="invis" />
                </React.Fragment>
              ))}

              <div className="row">
                <div className="col-md-12">
                  <nav aria-label="Page navigation">
                    <ul className="pagination justify-content-start">
                      {/* Show 'First' button */}
                      {pagination.page > 1 && (
                        <li className="page-item">
                          <a
                            className="page-link"
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              onPageChange(1);
                            }}
                          >
                            First
                          </a>
                        </li>
                      )}

                      {/* Show previous button */}
                      {pagination.page > 1 && (
                        <li className="page-item">
                          <a
                            className="page-link"
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              onPageChange(pagination.page - 1);
                            }}
                          >
                            &laquo;
                          </a>
                        </li>
                      )}

                      {/* Show the first few pages */}
                      {pagination.totalPages > 1 && Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, index) => (
                        <li className={`page-item ${pagination.page === index + 1 ? 'active' : ''}`} key={index}>
                          <a
                            className="page-link"
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              onPageChange(index + 1);
                            }}
                          >
                            {index + 1}
                          </a>
                        </li>
                      ))}

                      {/* Show ellipsis if there are more pages */}
                      {pagination.totalPages > 5 && pagination.page <= 3 && (
                        <li className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      )}

                      {/* Show pages near the end */}
                      {pagination.totalPages > 5 && pagination.page > 3 && pagination.page < pagination.totalPages - 2 && (
                        <>
                          <li className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                          <li className={`page-item ${pagination.page === pagination.totalPages ? 'active' : ''}`}>
                            <a
                              className="page-link"
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                onPageChange(pagination.totalPages);
                              }}
                            >
                              {pagination.totalPages}
                            </a>
                          </li>
                        </>
                      )}

                      {/* Show the last page */}
                      {pagination.totalPages > 1 && pagination.page < pagination.totalPages - 2 && (
                        <li className={`page-item ${pagination.page === pagination.totalPages ? 'active' : ''}`}>
                          <a
                            className="page-link"
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              onPageChange(pagination.totalPages);
                            }}
                          >
                            {pagination.totalPages}
                          </a>
                        </li>
                      )}

                      {/* Show next button */}
                      {pagination.page < pagination.totalPages && (
                        <li className="page-item">
                          <a
                            className="page-link"
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              onPageChange(pagination.page + 1);
                            }}
                          >
                            &raquo;
                          </a>
                        </li>
                      )}
                    </ul>
                  </nav>
                </div>
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
};


export async function getStaticProps() {
  const page = 1; // Default to page 1 for the initial build
  const apiKey = 'test'; // Replace with your actual API key

  try {
    const [postsResponse, categoriesResponse, recentPostsResponse] = await Promise.all([
      axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts?page=${page}`, {
        headers: { 'x-api-key': apiKey },
      }),
      axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories?popular=5`, {
        headers: { 'x-api-key': apiKey },
      }),
      axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts/recent`)
    ]);

    const postsData = postsResponse.data;
    const categoriesData = categoriesResponse.data.categories;
    const recentPostsData = recentPostsResponse.data;

    if (!postsData.success) {
      return {
        notFound: true,
      };
    }

    // Pass data to the page via props
    return {
      props: {
        initialPosts: postsData.data.posts,
        initialPagination: postsData.data.pagination,
        categories: categoriesData,
        recentPostsData,
      },
      revalidate: 60, // Revalidate at most once every 60 seconds
    };
  } catch (error) {
    console.error('Error fetching data:', error);

    return {
      notFound: true,
    };
  }
}


export default HomePage;
