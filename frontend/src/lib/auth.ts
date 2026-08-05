/**
 * authOptions của NextAuth v4.
 *
 * ★ `roles` BẮT BUỘC phải được nhét vào JWT ở callback `jwt` — middleware chạy ở
 *   edge, nó chỉ đọc được token, không gọi được DB. Thiếu chỗ này là phân quyền
 *   admin/dược sĩ hỏng im lặng.
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ROUTES } from "@/constants/routes";
import { loginRequest } from "@/services/auth";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { accessToken, refreshToken, user } = await loginRequest({
          email: credentials.email,
          password: credentials.password,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          accessToken,
          refreshToken,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.user = {
          id: user.id,
          email: user.email ?? "",
          name: user.name ?? "",
          roles: user.roles ?? [], // ⬅ bắt buộc, middleware đọc chỗ này
        };
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken;
      session.user = token.user as IAuthUser;
      session.error = token.error;
      return session;
    },
  },

  pages: { signIn: ROUTES.SIGNIN, error: ROUTES.SIGNIN },

  secret: process.env.NEXTAUTH_SECRET,
};
