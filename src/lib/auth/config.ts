import type { NextAuthOptions } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

// Cognito User Pool — sa-east-1 (São Paulo)
// User Pool ID: sa-east-1_P5AVMFTDD
// App Client ID: 5iki98keg7ikppijdvr5dfo20o
// Domain: pae-portfolio-auth.auth.sa-east-1.amazoncognito.com

export const authOptions: NextAuthOptions = {
  secret:
    process.env.NEXTAUTH_SECRET ??
    "9b62f01b5279cee7b5dd13d324e878691ec6387c8bed5c8fffd9bcf212ce0d0a",
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER,
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Respetar callbackUrl si apunta a nuestro dominio
      if (url.startsWith(baseUrl)) return url;
      // Default: ir al callback de auto-login
      return `${baseUrl}/auth/callback`;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.sub = profile.sub ?? token.sub;
        const cognitoProfile = profile as Record<string, unknown>;
        if (Array.isArray(cognitoProfile["cognito:groups"])) {
          token.groups = cognitoProfile["cognito:groups"] as string[];
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.sub = token.sub as string;
        session.user.groups = (token.groups as string[]) ?? [];
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
