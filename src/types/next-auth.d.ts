import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      // Cognito sub — identificador único del usuario
      sub?: string;
      // Grupos de Cognito: product-owners, vp-sponsors, etc.
      groups?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    groups?: string[];
  }
}
