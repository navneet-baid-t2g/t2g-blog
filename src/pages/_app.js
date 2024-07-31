// pages/_app.js
import Script from 'next/script';
import Head from 'next/head';

// Import CSS files
import '/public/css/bootstrap.css';
import '/public/css/font-awesome.min.css';
import '/public/css/style.css';
import '/public/css/responsive.css';
import '/public/css/colors.css';
import '/public/css/version/garden.css';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" type="image/x-icon" href="/public/images/favicon.ico"/>
      </Head>
      <Component {...pageProps} />
      {/* Common Scripts */}
      <Script src="/js/jquery.min.js" strategy="beforeInteractive" />
      <Script src="/js/tether.min.js" strategy="beforeInteractive" />
      <Script src="/js/bootstrap.min.js" strategy="beforeInteractive" />
      <Script src="/js/custom.js" strategy="lazyOnload" />
    </>
  );
}

export default MyApp;
