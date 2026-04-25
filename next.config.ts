import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // NEXTAUTH_URL debe estar disponible en build time para que NextAuth
  // genere los callbacks correctos en Amplify SSR
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "https://main.d1oo3gdtdngj2o.amplifyapp.com",
    // Exponer DATABASE_URL al runtime de Lambda en Amplify
    DATABASE_URL: process.env.DATABASE_URL ?? "",
  },
  // pptxgenjs hace dynamic imports a `node:fs` / `node:https` protegidos por
  // un runtime check `process.versions.node`. En el bundle del browser nunca
  // se ejecutan, pero webpack igual intenta resolverlos. Los ignoramos con
  // IgnorePlugin para que no se incluyan en el bundle client.
  webpack: (config, { isServer, webpack: wp }) => {
    if (!isServer) {
      config.plugins = config.plugins ?? [];
      config.plugins.push(
        new wp.IgnorePlugin({
          resourceRegExp: /^node:(fs|https)$/,
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
