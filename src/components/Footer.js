const Footer = () => {
    return (
        <>
            <footer className="footer">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-8 offset-lg-2">
                            <div className="widget">
                                <div className="footer-text text-center">
                                    <a href="index.html"><img src="../images/version/garden-footer-logo.png" alt className="img-fluid" /></a>
                                    <p>Forest Time is a personal blog for handcrafted, cameramade photography content, fashion styles from independent creatives around the world.</p>
                                    <div className="social">
                                        <a href="#" data-toggle="tooltip" data-placement="bottom" title="Facebook"><i className="fa fa-facebook" /></a>
                                        <a href="#" data-toggle="tooltip" data-placement="bottom" title="Twitter"><i className="fa fa-twitter" /></a>
                                        <a href="#" data-toggle="tooltip" data-placement="bottom" title="Instagram"><i className="fa fa-instagram" /></a>
                                        <a href="#" data-toggle="tooltip" data-placement="bottom" title="Google Plus"><i className="fa fa-google-plus" /></a>
                                        <a href="#" data-toggle="tooltip" data-placement="bottom" title="Pinterest"><i className="fa fa-pinterest" /></a>
                                    </div>
                                    <hr className="invis" />
                                    <div className="newsletter-widget text-center">
                                        <form className="form-inline">
                                            <input type="text" className="form-control" placeholder="Enter your email address" />
                                            <button type="submit" className="btn btn-primary">Subscribe <i className="fa fa-envelope-open-o" /></button>
                                        </form>
                                    </div>{/* end newsletter */}
                                </div>{/* end footer-text */}
                            </div>{/* end widget */}
                        </div>{/* end col */}
                    </div>
                    <div className="row">
                        <div className="col-md-12 text-center">
                            <br />
                            <br />
                            <div className="copyright">© Forest Time. Design: <a href="http://html.design">HTML Design</a>.</div>
                        </div>
                    </div>
                </div>{/* end container */}
            </footer>{/* end footer */}
        </>
    );
};
export default Footer;