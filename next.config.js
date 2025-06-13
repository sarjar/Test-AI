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
  // Configure webpack to handle server-side only modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-side only modules on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Externalize pdf-parse for server-side rendering
    config.externals = config.externals || [];
    config.externals.push({
      "pdf-parse": "commonjs pdf-parse",
    });

    return config;
  },
};

module.exports = nextConfig;
