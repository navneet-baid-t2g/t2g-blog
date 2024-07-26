// pages/_app.js
import { useEffect } from 'react';
import '../../public/css/bootstrap.css';
import '../../public/css/font-awesome.min.css';
import '../../public/css/style.css';
import '../../public/css/responsive.css';
import '../../public/css/colors.css';
import '../../public/css/version/garden.css';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Load external scripts
    const script = document.createElement('script');
    script.async = true;
    document.body.appendChild(script);

    // Clean up the script when component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
