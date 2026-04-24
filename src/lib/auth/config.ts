import type { NextAuthOptions } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

// Cognito User Pool — sa-east-1 (São Paulo)
// User Pool ID: sa-east-1_P5AVMFTDD
// App Client ID: tv3iv3b5cr3nu5ifojbchh5ta
// Domain: pae-portfolio-auth.auth.sa-east-1.amazoncognito.com

export const authOptions: NextAuthOptions = {
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER,
    }),
  ],
  callbacks: {
    // Agrega los grupos de Cognito y el sub al token JWT
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // El sub de Cognito es el identificador único del usuario
        token.sub = profile.sub ?? token.sub;
        // Cognito incluye los grupos en el token de acceso
        const cognitoProfile = profile as Record<string, unknown>;
        if (Array.isArray(cognitoProfile["cognito:groups"])) {
          token.groups = cognitoProfile["cognito:groups"] as string[];
        }
      }
      return token;
    },
    // Expone grupos y sub en la sesión del cliente
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
  secret: process.env.NEXTAUTH_SECRET,
};
