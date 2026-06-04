/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    // 👇 add this section
    remotePatterns: [
      {
        protocol: "https",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "stalwartng.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
