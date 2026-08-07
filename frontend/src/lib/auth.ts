/**
 * authOptions của NextAuth v4.
 *
 * ★ `roles` BẮT BUỘC phải được nhét vào JWT ở callback `jwt` — middleware chạy ở
 *   edge, nó chỉ đọc được token, không gọi được DB. Thiếu chỗ này là phân quyền
 *   admin/dược sĩ hỏng im lặng.
 */

import axios from "axios";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ROUTES } from "@/constants/routes";
import { loginRequest } from "@/services/auth";
import { loginWithGoogleRequest } from "@/services/auth";

// import { loginRequest } from "@/services/auth";
// import { transformApiResponse } from "@/queries/utils";

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

    // Đăng nhập Google OpenID Connect — xem ADR 0016.
    // `GoogleSignInButton` lấy idToken từ Google Identity Services phía client, rồi gọi
    // `signIn("google", { idToken })`; authorize() ở đây là nơi DUY NHẤT gọi backend,
    // giữ đúng kiến trúc "UI → signIn → authorize → service" như luồng credentials ở trên.
    CredentialsProvider({
      id: "google",
      name: "google",
      credentials: {
        idToken: { label: "Google ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;

        try {
          const res = await loginWithGoogleRequest({ idToken: credentials.idToken });
          return {
            id: res.user.id,
            email: res.user.email,
            name: res.user.name,
            roles: res.user.roles,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
          };
        } catch (error) {
          // Ném lại message gốc (vd. "Google ID token không hợp lệ") để UI hiển thị đúng
          // lý do thay vì thông báo NextAuth mặc định "CredentialsSignin".
          const message =
            axios.isAxiosError(error) && error.response?.data?.message
              ? String(error.response.data.message)
              : "Đăng nhập bằng Google thất bại.";
          throw new Error(message);
        }
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
