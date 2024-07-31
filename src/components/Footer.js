import Image from "next/image";
const Footer = () => {
    return (
        <>
            <footer className="footer">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-8 offset-lg-2">
                            <div className="widget">
                                <div className="footer-text text-center">
                                    <a href="/">
                                        <Image
                                            src="/images/version/garden-footer-logo.png"
                                            alt="Garden Footer Logo"
                                            className="img-fluid"
                                            width={256} 
                                            height={85} 
                                        />
                                    </a>                                    <p>Forest Time is a personal blog for handcrafted, cameramade photography content, fashion styles from independent creatives around the world.</p>
                                    <div className="social">
                                        <a href="https://www.facebook.com/tech2globe.software" data-toggle="tooltip" data-placement="bottom" title="Facebook" data-animation="false"><i className="fa fa-facebook" /></a>
                                        <a href="https://twitter.com/Tech2Globe" data-toggle="tooltip" data-placement="bottom" title="Twitter" data-animation="false"><i className="fa fa-twitter" /></a>
                                        <a href="https://www.instagram.com/tech2globeweb/" data-toggle="tooltip" data-placement="bottom" title="Instagram" data-animation="false"><i className="fa fa-instagram" /></a>
                                        <a href="https://www.youtube.com/user/Tech2Globe" data-toggle="tooltip" data-placement="bottom" title="Youtube" data-animation="false"><i className="fa fa-youtube" /></a>
                                        <a href="https://www.linkedin.com/company/tech2globe" data-toggle="tooltip" data-placement="bottom" title="Linkedin" data-animation="false"><i className="fa fa-linkedin" /></a>
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
                            <div className="copyright">© Copyright 2024 | All Rights Reserved by Tech2Globe.</div>
                        </div>
                    </div>
                </div>{/* end container */}
            </footer>{/* end footer */}
        </>
    );
};
export default Footer;