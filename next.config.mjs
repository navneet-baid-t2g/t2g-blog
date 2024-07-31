/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '**',
      }
      , {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        pathname: '**',
      }
      , {
        protocol: 'http',
        hostname: 'www.tech2globe.com',
        pathname: '**',
      }
      , {
        protocol: 'https',
        hostname: 'www.tech2globe.com',
        pathname: '**',
      }
      , {
        protocol: 'https',
        hostname: 'blog.tech2globe.com',
        pathname: '**',
      }
    ],
  },
};

export default nextConfig;
