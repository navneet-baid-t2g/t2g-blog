const Header = () => {
    return (
        <>
            <header className="header">
                <div className="container">
                    <nav className="navbar navbar-inverse navbar-toggleable-md">
                        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#Forest Timemenu" aria-controls="Forest Timemenu" aria-expanded="false" aria-label="Toggle navigation">
                            <span className="navbar-toggler-icon" />
                        </button>
                        <div className="collapse navbar-collapse justify-content-md-center" id="Forest Timemenu">
                            <ul className="navbar-nav">
                                <li className="nav-item">
                                    <a className="nav-link color-green-hover" href="garden-index.html">Home</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link color-green-hover" href="garden-category.html">Gardening</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link color-green-hover" href="garden-category.html">Outdoor Living</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link color-green-hover" href="garden-category.html">Indoor Living</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link color-green-hover" href="garden-category.html">Shopping Guides</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link color-green-hover" href="garden-contact.html">Contact</a>
                                </li>
                            </ul>
                        </div>
                    </nav>
                </div>{/* end container */}
            </header>{/* end header */}
        </>
    )
}

export default Header;