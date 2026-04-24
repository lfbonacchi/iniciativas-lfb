import type { NextAuthOptions } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

// Mapeo de grupos de Cognito a roles de la app
const GROUP_TO_ROLE: Record<string, string> = {
  "vp-sponsors": "user",
  "area-transformacion": "area_transformacion",
  "product-owners": "user",
  "business-owners": "user",
  "scrum-masters": "user",
};

// Grupos que corresponden a VPs
const VP_GROUPS = new Set(["vp-sponsors"]);

export const authOptions: NextAuthOptions = {
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER,
    }),
  ],

  callbacks: {
    // Enriquecer el JWT con grupos y rol de Cognito
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // Los grupos vienen en el id_token de Cognito como "cognito:groups"
        const cognitoProfile = profile as Record<string, unknown>;
        const groups: string[] =
          (cognitoProfile["cognito:groups"] as string[]) ?? [];

        token.groups = groups;
        token.global_role =
          groups.find((g) => GROUP_TO_ROLE[g] === "area_transformacion")
            ? "area_transformacion"
            : "user";
        token.is_vp = groups.some((g) => VP_GROUPS.has(g));
        token.email = cognitoProfile.email as string;
        token.name = cognitoProfile.name as string;
      }
      return token;
    },

    // Exponer datos del JWT en la sesión del cliente
    async session({ session, token }) {
      session.user.email = token.email as string;
      session.user.name = token.name as string;
      session.user.groups = token.groups as string[];
      session.user.global_role = token.global_role as string;
      session.user.is_vp = token.is_vp as boolean;
      return session;
    },
  },

  pages: {
    signIn: "/",
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas — jornada laboral
  },
};
