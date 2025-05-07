// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      unoptimized: true,  // if you're NOT using Next.js <Image> component for optimization
    },
  };
  
  export default nextConfig;