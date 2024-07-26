const TopBar = () => {

    return (
        <>
            <div className="topbar-section">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-lg-4 col-md-6 col-sm-6 hidden-xs-down">
                            <div className="topsocial">
                                <a href="#" data-toggle="tooltip" data-placement="bottom" title="Facebook"><i className="fa fa-facebook" /></a>
                                <a href="#" data-toggle="tooltip" data-placement="bottom" title="Youtube"><i className="fa fa-youtube" /></a>
                                <a href="#" data-toggle="tooltip" data-placement="bottom" title="Pinterest"><i className="fa fa-pinterest" /></a>
                                <a href="#" data-toggle="tooltip" data-placement="bottom" title="Twitter"><i className="fa fa-twitter" /></a>
                                <a href="#" data-toggle="tooltip" data-placement="bottom" title="Flickr"><i className="fa fa-flickr" /></a>
                                <a href="#" data-toggle="tooltip" data-placement="bottom" title="Instagram"><i className="fa fa-instagram" /></a>
                                <a href="#" data-toggle="tooltip" data-placement="bottom" title="Google+"><i className="fa fa-google-plus" /></a>
                            </div>{/* end social */}
                        </div>{/* end col */}
                        <div className="col-lg-4 hidden-md-down">
                        </div>{/* end col */}
                        <div className="col-lg-4 col-md-6 col-sm-6 col-xs-12">
                            <div className="topsearch text-right">
                                <a data-toggle="collapse" href="#collapseExample" aria-expanded="false" aria-controls="collapseExample"><i className="fa fa-search" /> Search</a>
                            </div>{/* end search */}
                        </div>{/* end col */}
                    </div>{/* end row */}
                </div>{/* end header-logo */}
            </div>{/* end topbar */}
        </>
    );
}

export default TopBar;