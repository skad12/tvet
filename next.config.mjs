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
    ],
  },
};

export default nextConfig;
