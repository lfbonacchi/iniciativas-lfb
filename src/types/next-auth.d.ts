import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      groups: string[];
      global_role: string;
      is_vp: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    groups: string[];
    global_role: string;
    is_vp: boolean;
  }
}
