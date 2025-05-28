/** @type {import('next').NextConfig} */

// Set LangChain configuration
process.env.LANGCHAIN_CALLBACKS_BACKGROUND = "true";

const nextConfig = {
  images: {
    domains: ["images.unsplash.com"],
  },
  // Explicitly set experimental options for Next.js 15+
  experimental: {
    // Set swcPlugins to an empty array instead of false
    swcPlugins: [],
  },
};

module.exports = nextConfig;
