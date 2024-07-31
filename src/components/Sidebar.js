import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';
import { format } from 'date-fns';
import Image from 'next/image';
const Sidebar = ({ components, categories, recentPostsData }) => {
    // Component mapping
    const componentMap = {
        SearchBar: <SearchBar />,
        RecentPosts: <RecentPosts recentPostsData={recentPostsData} />,
        PopularCategories: <PopularCategories categories={categories} />
    };
    return (
        <>
            <div className="col-lg-3 col-md-12 col-sm-12 col-xs-12">
                <div className="sidebar">
                    {components.map((componentName, index) => (
                        <div key={index}>
                            {componentMap[componentName]}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch results from the API
    const fetchResults = async (query) => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts/search?query=${encodeURIComponent(query)}`);
            setResults(response.data.results);
        } catch (error) {
            setError('Error fetching search results.');
            console.error('Error fetching search results:', error);
        } finally {
            setLoading(false);
        }
    };

    // Debounced version of fetchResults
    const debouncedFetchResults = useCallback(debounce((query) => {
        fetchResults(query);
    }, 800), []);

    // Fetch results on query change
    useEffect(() => {
        if (query) {
            debouncedFetchResults(query);
        } else {
            setResults([]);
        }
    }, [query, debouncedFetchResults]);

    // Handle input change
    const handleChange = (e) => {
        setQuery(e.target.value);
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        if (query) {
            fetchResults(query);
        }
    };

    return (
        <>
            <div className="widget" id="sidebar-search">
                <h2 className="widget-title">Search</h2>
                <form className="form-inline search-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search on the site"
                            value={query}
                            onChange={handleChange}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">
                        <i className="fa fa-search" />
                    </button>
                </form>
                {query && <div className="search-results">
                    {loading && <p>Loading...</p>}
                    {error && <p>{error}</p>}
                    {results.length === 0 && !loading && !error && <p>No results found</p>}
                    <ul>
                        {results.map((result) => (
                            <li key={result.ID}>
                                <a href={`/${result.slug}`}>
                                    {result.post_title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>}
            </div>
        </>
    );
};

const RecentPosts = ({ recentPostsData }) => {
    if (!recentPostsData) {
        return <div>Loading...</div>;
    }
    return (
        <>
            <div className="widget">
                <h2 className="widget-title">Recent Posts</h2>
                <div className="blog-list-widget">
                    <div className="list-group">
                        {
                            recentPostsData.data.posts.map((post) => (
                                <a key={post.ID} href={`/${post.post_name}`} className="list-group-item list-group-item-action flex-column align-items-start">
                                    <div className="w-100 justify-content-between">
                                        {post.thumbnail_url != "" && <Image src={post.thumbnail_url} alt={post.post_title} width={100} height={80} className="img-fluid float-left" />}
                                        <h6 className="mb-0 truncate-2-lines">{post.post_title}</h6>
                                        <small>{format(new Date(post.post_date), 'MMMM d, yyyy')}</small>
                                    </div>
                                </a>
                            ))
                        }
                    </div>
                </div>{/* end blog-list */}
            </div>{/* end widget */}
        </>
    );
}

const Advertising = () => {
    return (
        <>
            <div className="widget">
                <h2 className="widget-title">Advertising</h2>
                <div className="banner-spot clearfix">
                    <div className="banner-img">
                        <img src="../upload/banner_04.jpg" alt className="img-fluid" />
                    </div>{/* end banner-img */}
                </div>{/* end banner */}
            </div>{/* end widget */}
        </>
    )
}

const Instafeed = () => {
    return (
        <>
            <div className="widget">
                <h2 className="widget-title">Instagram Feed</h2>
                <div className="instagram-wrapper clearfix">
                    <a href="#"><img src="../upload/garden_sq_01.jpg" alt className="img-fluid" /></a>
                    <a href="#"><img src="../upload/garden_sq_02.jpg" alt className="img-fluid" /></a>
                    <a href="#"><img src="../upload/garden_sq_03.jpg" alt className="img-fluid" /></a>
                    <a href="#"><img src="../upload/garden_sq_04.jpg" alt className="img-fluid" /></a>
                    <a href="#"><img src="../upload/garden_sq_05.jpg" alt className="img-fluid" /></a>
                    <a href="#"><img src="../upload/garden_sq_06.jpg" alt className="img-fluid" /></a>
                    <a href="#"><img src="../upload/garden_sq_07.jpg" alt className="img-fluid" /></a>
                    <a href="#"><img src="../upload/garden_sq_08.jpg" alt className="img-fluid" /></a>
                    <a href="#"><img src="../upload/garden_sq_09.jpg" alt className="img-fluid" /></a>
                </div>{/* end Instagram wrapper */}
            </div>{/* end widget */}
        </>
    )
}
const PopularCategories = ({ categories }) => {


    if (!categories) {
        return <div>Loading...</div>;
    }

    return (
        <div className="widget">
            <h2 className="widget-title">Popular Categories</h2>
            <div className="link-widget">
                <ul>
                    {categories && categories
                        .filter(category => category.post_count >= 1)
                        .map(category => (
                            <li key={category.id}>
                                <a href={`/category/${category.slug}`}>
                                    {category.name} <span>({category.post_count})</span>
                                </a>
                            </li>
                        ))}

                </ul>
            </div>
        </div>
    );
}

export default Sidebar;