import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  webpack: (config) => {
    config.externals = config.externals || [];
    // Handle 3d-force-graph properly
    if (Array.isArray(config.externals)) {
      config.externals.push({
        "3d-force-graph": "commonjs 3d-force-graph",
      });
    }
    return config;
  },
};

export default nextConfig;
