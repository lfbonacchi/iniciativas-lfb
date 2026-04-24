import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

// Cognito User Pool — sa-east-1 (São Paulo)
// User Pool ID: sa-east-1_P5AVMFTDD
// App Client ID: 5iki98keg7ikppijdvr5dfo20o

const cognitoClient = new CognitoIdentityProviderClient({
  region: "sa-east-1",
});

export const authOptions: NextAuthOptions = {
  secret:
    process.env.NEXTAUTH_SECRET ??
    "9b62f01b5279cee7b5dd13d324e878691ec6387c8bed5c8fffd9bcf212ce0d0a",
  providers: [
    CredentialsProvider({
      name: "PAE",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // Autenticar directamente contra Cognito con USER_PASSWORD_AUTH
          const authResult = await cognitoClient.send(
            new InitiateAuthCommand({
              AuthFlow: "USER_PASSWORD_AUTH",
              ClientId:
                process.env.COGNITO_CLIENT_ID ?? "5iki98keg7ikppijdvr5dfo20o",
              AuthParameters: {
                USERNAME: credentials.email,
                PASSWORD: credentials.password,
              },
            }),
          );

          const accessToken =
            authResult.AuthenticationResult?.AccessToken;
          if (!accessToken) return null;

          // Obtener datos del usuario desde Cognito
          const userResult = await cognitoClient.send(
            new GetUserCommand({ AccessToken: accessToken }),
          );

          const attrs = userResult.UserAttributes ?? [];
          const get = (name: string) =>
            attrs.find((a) => a.Name === name)?.Value ?? "";

          // Obtener grupos del token de acceso (decodificar JWT)
          const payload = JSON.parse(
            Buffer.from(accessToken.split(".")[1], "base64url").toString(),
          );
          const groups: string[] = payload["cognito:groups"] ?? [];

          return {
            id: get("sub"),
            email: get("email"),
            name: get("name"),
            groups,
          };
        } catch {
          // Credenciales incorrectas u otro error de Cognito
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.groups = (user as { groups?: string[] }).groups ?? [];
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
  session: {
    strategy: "jwt",
  },
};
