import Link from 'next/link';
import Image from 'next/image';

const LogoHeader = () => {
  return (
    <div className="header-section">
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="logo">
              <Link href="/" passHref>
                <Image
                  src="/images/tech2globe-logo.png"
                  alt="Garden Logo"
                  width={256} // Width adjusted to fit the design
                  height={85} // Height adjusted to fit the design
                  priority // Ensures the image is preloaded
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogoHeader;
