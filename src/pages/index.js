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
const HomePage = ({ initialPosts, initialPagination, categories,recentPostsData }) => {
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
      const response = await fetch(`/api/posts?page=${page}`, {
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

  useEffect(() => {
    fetchPosts(currentPage);
  }, [currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPosts(page);
  };

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css?family=Droid+Sans:400,700" rel="stylesheet" />
        <link href="/css/bootstrap.css" rel="stylesheet" />
        <link href="/css/font-awesome.min.css" rel="stylesheet" />
        <link href="/css/style.css" rel="stylesheet" />
        <link href="/css/responsive.css" rel="stylesheet" />
        <link href="/css/colors.css" rel="stylesheet" />
        <link href="/css/version/garden.css" rel="stylesheet" />
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
      <Script src="/js/jquery.min.js" strategy="beforeInteractive" />
      <Script src="/js/tether.min.js" strategy="beforeInteractive" />
      <Script src="/js/bootstrap.min.js" strategy="beforeInteractive" />
      <Script src="/js/custom.js" strategy="lazyOnload" />
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
                  <div className="blog-box row">
                    <div className="col-md-4">
                      <div className="post-media">
                        <a href={`/blog/${post.post_name}`} title>
                          <img
                            src={`${post.thumbnail_url}`} 
                            alt={post.post_title}
                            className="img-fluid"
                          />
                          <div className="hovereffect" />
                        </a>
                      </div>
                    </div>
                    <div className="blog-meta big-meta col-md-8">
                      {/* <span className="bg-aqua">
                        <Link href={`/category/${post.categories}`} title>
                          {post.categories}
                        </Link>
                      </span> */}
                      <h4>
                        <Link href={`/blog/${post.post_name}`} title>
                          {post.post_title}
                        </Link>
                      </h4>
                      <p>{post.post_excerpt}</p>
                      <small>
                        <Link href="#" title>
                          <i className="fa fa-comment-o" /> {post.comment_count}
                        </Link>
                      </small>
                      <small>
                        <Link href={`/blog/${post.post_name}`} title>
                          {format(new Date(post.post_date), 'MMMM d, yyyy')}
                        </Link>
                      </small>
                      <small>
                        <Link href="#" title>
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

export async function getServerSideProps(context) {
  const page = context.query.page || 1; // Default to page 1 if not specified
  const apiKey = 'test'; // Replace with your actual API key

  try {
    const [postsResponse, categoriesResponse, recentPostsResponse] = await Promise.all([
      axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts?page=${page}`, {
        headers: { 'x-api-key': apiKey },
      }),
      axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/category?popular=5`, {
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
    };
  } catch (error) {
    console.error('Error fetching data:', error);

    return {
      notFound: true,
    };
  }
}

export default HomePage;
