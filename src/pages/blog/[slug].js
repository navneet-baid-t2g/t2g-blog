import Script from 'next/script';
import Head from 'next/head';
import Searchbar from "@/components/searchbar";
import TopBar from "@/components/topbar";
import LogoHeader from "@/components/LogoHeader";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';

const Blog = ({ blog, author, comments, categories, recentPostsData, relatedPostsData }) => {
    const componentsToShow = [
        'SearchBar',
        'RecentPosts',
        'Advertising',
        'Instafeed',
        'PopularCategories'
    ];
    return (
        <>
            <Head>
                <title>{blog.post_title} | Your Blog Name</title>
                <meta name="description" content={blog.excerpt || "Default description"} />
                <meta property="og:title" content={blog.post_title} />
                <meta property="og:description" content={blog.excerpt || "Default description"} />
                <meta property="og:image" content={blog.thumbnail_url || "URL-to-default-image"} />
                <meta property="og:url" content={`https://yourdomain.com/blog/${blog.slug}`} />
                <meta property="og:type" content="article" />
                <link href="https://fonts.googleapis.com/css?family=Droid+Sans:400,700" rel="stylesheet" />
                <link href="/css/bootstrap.css" rel="stylesheet" />
                <link href="/css/font-awesome.min.css" rel="stylesheet" />
                <link href="/css/style.css" rel="stylesheet" />
                <link href="/css/responsive.css" rel="stylesheet" />
                <link href="/css/colors.css" rel="stylesheet" />
                <link href="/css/version/garden.css" rel="stylesheet" />
            </Head>

            <div className='wrapper'>
                <Searchbar />
                <TopBar />
                <LogoHeader />
                {/* <Header /> */}
        
                <div className="page-title wb">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-8 col-md-8 col-sm-12 col-xs-12">
                                <h2><i className="fa fa-leaf bg-green" /> Blog</h2>
                            </div>{/* end col */}
                            <div className="col-lg-4 col-md-4 col-sm-12 hidden-xs-down hidden-sm-down">
                                <ol className="breadcrumb">
                                    <li className="breadcrumb-item"><a href="../">Home</a></li>
                                    <li className="breadcrumb-item active">Blog</li>
                                </ol>
                            </div>{/* end col */}
                        </div>{/* end row */}
                    </div>{/* end container */}
                </div>{/* end page-title */}
                <section className="section wb" id="post-detail">
                    <div className="container">
                        <div className="row">
                            <BlogDetail blog={blog} author={author} comments={comments} relatedPostsData={relatedPostsData} />
                            <Sidebar components={componentsToShow} categories={categories} recentPostsData={recentPostsData} />
                        </div>{/* end row */}
                    </div>{/* end container */}
                </section>

                <Footer />
                <ScrollToTop />
            </div>
            <Script src="/js/jquery.min.js" strategy="beforeInteractive" />
            <Script src="/js/tether.min.js" strategy="beforeInteractive" />
            <Script src="/js/bootstrap.min.js" strategy="beforeInteractive" />
            <Script src="/js/custom.js" strategy="lazyOnload" />
        </>
    )
}
const BlogDetail = ({ blog, author, comments,relatedPostsData }) => {
    // Function to get initials from the author's display name
    const getInitials = (name) => {
        if (!name) return '';
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return `${names[0][0]}${names[0][1] || ''}`.toUpperCase();
    };
    if (!blog) {
        return <div>Loading...</div>;
    }
    const [facebookShareUrl, setFacebookShareUrl] = useState('');
    const [twitterShareUrl, setTwitterShareUrl] = useState('');

    useEffect(() => {
        setFacebookShareUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`);
        setTwitterShareUrl(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(blog.post_title)}`);
    }, [blog.post_title]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        website: '',
        comment: ''
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/comment/post-comment`, {
                ...formData,
                postId: blog.ID
            });
            setMessage(response.data.message);
            setFormData({
                name: '',
                email: '',
                website: '',
                comment: ''
            });
        } catch (error) {
            console.error('Error submitting comment:', error);
            setMessage('Error submitting comment');
        }
    };

    const filteredRelatedPosts = relatedPostsData.data.posts.filter(post => post.ID !== blog.ID);

    return (
        <>
            <div className="col-lg-9 col-md-12 col-sm-12 col-xs-12">
                <div className="page-wrapper">
                    <div className="blog-title-area">
                        <span className="color-green">
                            <a href="#" title="">
                                {
                                    blog.categories.map((category, index) => (
                                        <>
                                            {category}
                                            {index < blog.categories.length - 1 && ', '}
                                        </>
                                    ))
                                }
                            </a>
                        </span>

                        <h3>{blog.post_title}</h3>
                        <div className="blog-meta big-meta">
                            <small><a href="garden-single.html" title>{format(new Date(blog.post_date), 'MMMM d, yyyy')}</a></small>
                            <small><a href="blog-author.html" title>by {blog.author_name}</a></small>
                        </div>{/* end meta */}
                        <div className="post-sharing">
                            <ul className="list-inline">
                                <li><a href={facebookShareUrl} className="fb-button btn btn-primary"><i className="fa fa-facebook" /> <span className="down-mobile">Share on Facebook</span></a></li>
                                <li><a href={twitterShareUrl} className="tw-button btn btn-primary"><i className="fa fa-twitter" /> <span className="down-mobile">Tweet on Twitter</span></a></li>
                            </ul>
                        </div>{/* end post-sharing */}
                    </div>{/* end title */}
                    <div className="single-post-media">
                        <img src={blog.thumbnail_url} alt className="img-fluid" />
                    </div>{/* end media */}
                    <div className="blog-content" dangerouslySetInnerHTML={{ __html: (blog.post_content) }} />

                    <div className="blog-title-area">
                        <div className="tag-cloud-single">
                            <span>Tags</span>
                            {
                                blog && blog.tags.map((tag) => (
                                    <small key={tag}><a href="#" title={tag}>{tag}</a></small>
                                ))
                            }

                        </div>{/* end meta */}
                        <div className="post-sharing">
                            <ul className="list-inline">
                                <li><a href={facebookShareUrl} className="fb-button btn btn-primary"><i className="fa fa-facebook" /> <span className="down-mobile">Share on Facebook</span></a></li>
                                <li><a href={twitterShareUrl} className="tw-button btn btn-primary"><i className="fa fa-twitter" /> <span className="down-mobile">Tweet on Twitter</span></a></li>
                            </ul>
                        </div>{/* end post-sharing */}
                    </div>{/* end title */}
                    <hr className="invis1" />
                    <div className="custombox authorbox clearfix">
                        <h4 className="small-title">About author</h4>
                        <div className="row">
                            <div className="col-lg-2 col-md-2 col-sm-2 col-xs-12">
                                {author.profileImage ? (
                                    <img
                                        src={author.profileImage}
                                        alt={author.displayName}
                                        className="img-fluid rounded-circle"
                                    />
                                ) : (
                                    <div className="d-flex align-items-center justify-content-center bg-light text-dark rounded-circle" style={{ width: '100px', height: '100px', fontSize: '24px', background: 'antiquewhite' }}>
                                        {getInitials(author.displayName)}
                                    </div>
                                )}
                            </div>{/* end col */}
                            <div className="col-lg-10 col-md-10 col-sm-10 col-xs-12">
                                <h4><a href="#">{author.displayName}</a></h4>
                                <div dangerouslySetInnerHTML={{ __html: (author.description) }} />
                                
                                <div className="topsocial">
                                    {author.socialHandles.facebook && (
                                        <a href={author.socialHandles.facebook} data-toggle="tooltip" data-placement="bottom" title="Facebook">
                                            <i className="fa fa-facebook" />
                                        </a>
                                    )}
                                    {author.socialHandles.youtube && (
                                        <a href={author.socialHandles.youtube} data-toggle="tooltip" data-placement="bottom" title="Youtube">
                                            <i className="fa fa-youtube" />
                                        </a>
                                    )}
                                    {author.socialHandles.pinterest && (
                                        <a href={author.socialHandles.pinterest} data-toggle="tooltip" data-placement="bottom" title="Pinterest">
                                            <i className="fa fa-pinterest" />
                                        </a>
                                    )}
                                    {author.socialHandles.twitter && (
                                        <a href={author.socialHandles.twitter} data-toggle="tooltip" data-placement="bottom" title="Twitter">
                                            <i className="fa fa-twitter" />
                                        </a>
                                    )}
                                    {author.socialHandles.instagram && (
                                        <a href={author.socialHandles.instagram} data-toggle="tooltip" data-placement="bottom" title="Instagram">
                                            <i className="fa fa-instagram" />
                                        </a>
                                    )}
                                    {author.website && (
                                        <a href={author.website} data-toggle="tooltip" data-placement="bottom" title="Website">
                                            <i className="fa fa-link" />
                                        </a>
                                    )}
                                </div>{/* end social */}
                            </div>{/* end col */}

                        </div>{/* end row */}
                    </div>{/* end author-box */}
                    <hr className="invis1" />
                    <div className="custombox clearfix">
                        <h4 className="small-title">You may also like</h4>
                        <div className="row">
                            {filteredRelatedPosts.length > 0 ? (
                                filteredRelatedPosts.map(post => (
                                    <div className="col-lg-6" key={post.ID}>
                                        <div className="blog-box">
                                            <div className="post-media">
                                                <a href={`/blog/${post.post_name}`} title>
                                                    <img src={post.thumbnail_url} alt className="img-fluid" />
                                                    <div className="hovereffect">
                                                        <span className />
                                                    </div>
                                                </a>
                                            </div>
                                            <div className="blog-meta">
                                                <h4><a href={`/blog/${post.post_name}`} title>{post.post_title}</a></h4>
                                                <small><a href={`/blog/category/${post.categories[0]}`} title>{post.categories}</a></small>
                                                <small><a href={`/blog/${post.post_name}`} title>{format(new Date(post.post_date), 'MMMM d, yyyy')}</a></small>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>No related posts available.</p>
                            )}
                        </div>
                    </div>
                    <hr className="invis1" />
                    <div className="custombox clearfix">
                        <h4 className="small-title">
                            {comments.length} Comment{comments.length !== 1 ? 's' : ''}
                        </h4>
                        {comments.length == 0 ? (
                            <div className="no-comments">
                                <p>No comments found.</p>
                            </div>
                        ) : (
                            <div className="row">
                                <div className="col-lg-12">
                                    <div className="comments-list">
                                        {comments.map(comment => (
                                            <div className="media" key={comment.comment_ID} style={{ gap: '10px' }}>
                                                <a className="media-left" href="#">
                                                    <div className="d-flex align-items-center justify-content-center bg-light text-dark rounded-circle" style={{ width: '65px', height: '65px', fontSize: '20px', background: 'antiquewhite' }}>
                                                        {getInitials(author.displayName)}
                                                    </div>
                                                </a>
                                                <div className="media-body">
                                                    <h4 className="media-heading user_name">
                                                        {comment.comment_author} <small>{format(new Date(comment.comment_date), 'MMMM d, yyyy')}</small>
                                                    </h4>
                                                    <p>{comment.comment_content}</p>
                                                    {/* <a href="#" className="btn btn-primary btn-sm">Reply</a> */}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>{/* end col */}
                            </div>
                        )}
                    </div>{/* end custombox */}

                    <hr className="invis1" />
                    <div className="custombox clearfix">
                        <h4 className="small-title">Leave a Reply</h4>
                        <div className="row">
                            <div className="col-lg-12">
                                <form className="form-wrapper" onSubmit={handleSubmit}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        placeholder="Your name *"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        placeholder="Email address *"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    <input
                                        type="url"
                                        className="form-control"
                                        name="website"
                                        placeholder="Website"
                                        value={formData.website}
                                        onChange={handleChange}
                                    />
                                    <textarea
                                        className="form-control"
                                        name="comment"
                                        placeholder="Your comment *"
                                        value={formData.comment}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button type="submit" className="btn btn-primary">Submit Comment</button>
                                </form>
                                {message && <p>{message}</p>}
                            </div>
                        </div>
                    </div>
                </div>{/* end page-wrapper */}
            </div>{/* end col */}

        </>
    );
};

export async function getServerSideProps(context) {
    const { slug } = context.params;
    const apiKey = 'test'; // Replace with your actual API key

    try {
        // Fetch the blog post, comments, author details, categories, and recent posts concurrently
        const [postResponse, categoriesResponse, recentPostsResponse] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/post/${slug}`),
            axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/category?popular=5`, {
                headers: { 'x-api-key': apiKey },
            }),
            axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts/recent`),
        ]);

        const blog = postResponse.data.post;
        const comments = postResponse.data.comments;

        let author = null;
        if (blog.post_author) {
            const authorResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/author/${blog.post_author}`);
            author = authorResponse.data.authors[0];
        }
        let relatedPostsData = null;

        if (blog) {
            const relatedPostsResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts/related?categoryName=${postResponse.data.post.categories[0]}`)
            relatedPostsData = relatedPostsResponse.data
        }

        const categoriesData = categoriesResponse.data.categories;
        const recentPostsData = recentPostsResponse.data;

        // Pass data to the page via props
        return {
            props: {
                blog,
                author,
                comments,
                categories: categoriesData,
                recentPostsData,
                relatedPostsData,
            }
        };
    } catch (error) {
        console.error('Error fetching data:', error);

        return {
            notFound: true,
        };
    }
}
export default Blog;