import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // Exponer variables de entorno al runtime de Next.js en Amplify SSR
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "",
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID ?? "",
    COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET ?? "",
    COGNITO_ISSUER: process.env.COGNITO_ISSUER ?? "",
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
