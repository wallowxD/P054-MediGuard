import type { DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

/**
 * Middleware chỉ đọc được `roles` nếu nó nằm trong JWT.
 * Xem callback jwt/session ở `src/lib/auth.ts`.
 */
declare module "next-auth" {
  interface Session {
    user: IAuthUser;
    accessToken: string;
    refreshToken?: string;
    error?: string;
  }

  interface User extends DefaultUser {
    accessToken: string;
    refreshToken: string;
    roles: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    user?: IAuthUser;
    error?: string;
  }
}
