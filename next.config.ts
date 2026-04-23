import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // pptxgenjs hace dynamic imports a `node:fs` / `node:https` protegidos por
  // un runtime check `process.versions.node`. En el bundle del browser nunca
  // se ejecutan, pero webpack igual intenta resolverlos. Los ignoramos con
  // IgnorePlugin para que no se incluyan en el bundle client.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins = config.plugins ?? [];
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^node:(fs|https)$/,
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
