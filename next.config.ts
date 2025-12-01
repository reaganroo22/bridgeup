import type { NextConfig } from "next";
import path from "node:path";

const LOADER = path.resolve(__dirname, 'src/visual-edits/component-tagger-loader.js');

const nextConfig: NextConfig = {
  // Removed 'output: export' to enable API routes
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // outputFileTracingRoot: path.resolve(__dirname, '../../'),
  webpack: (config, { isServer }) => {
    // Exclude mobile app directories from webpack bundling
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: [
        /node_modules/,
        /bridgeup/,
        /refreshed_wizzmo/,
        /mobile/,
        /bridgeup_clean/,
      ],
    });

    return config;
  },
  turbopack: {
    rules: {
      "*.{jsx,tsx}": {
        loaders: [LOADER]
      }
    }
  }
};

export default nextConfig;
// Orchids restart: 1758918309461
