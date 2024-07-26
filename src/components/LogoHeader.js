import Link from 'next/link';

const LogoHeader = () => {
    return (
        <>
            <div className="header-section">
                <div className="container">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="logo">
                                <Link href="/">
                                    <img src="../images/version/garden-logo.png" alt="Garden Logo" />
                                </Link>
                            </div>{/* end logo */}
                        </div>
                    </div>{/* end row */}
                </div>{/* end container */}
            </div>{/* end header-section */}
        </>
    );
}

export default LogoHeader;
