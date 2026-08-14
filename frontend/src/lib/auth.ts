/**
 * authOptions của NextAuth v4.
 *
 * ★ `roles` BẮT BUỘC phải được nhét vào JWT ở callback `jwt` — middleware chạy ở
 *   edge, nó chỉ đọc được token, không gọi được DB. Thiếu chỗ này là phân quyền
 *   admin/dược sĩ hỏng im lặng.
 */

import axios from "axios";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { ROUTES } from "@/constants/routes";
import {
  loginRequest,
  loginWithGoogleRequest,
  refreshTokenRequest,
} from "@/services/auth";

// Làm mới trước hạn một phút để token không hết hạn giữa lúc lấy session và gửi API.
const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000;

const refreshAccessToken = async (token: JWT): Promise<JWT> => {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  try {
    const refreshed = await refreshTokenRequest({
      refreshToken: token.refreshToken,
    });

    return {
      ...token,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      accessTokenExpires: Date.now() + refreshed.expiresIn * 1000,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
};

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

        const { accessToken, refreshToken, expiresIn, user } = await loginRequest({
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
          expiresIn,
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
            expiresIn: res.expiresIn,
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
        token.accessTokenExpires = Date.now() + user.expiresIn * 1000;
        token.user = {
          id: user.id,
          email: user.email ?? "",
          name: user.name ?? "",
          roles: user.roles ?? [], // ⬅ bắt buộc, middleware đọc chỗ này
        };
        token.error = undefined;
        return token;
      }

      if (
        token.accessToken &&
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires - ACCESS_TOKEN_REFRESH_BUFFER_MS
      ) {
        return token;
      }

      // Session cũ chưa có accessTokenExpires cũng đi qua đây một lần để được nâng cấp.
      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user = token.user as IAuthUser;
      session.error = token.error;
      return session;
    },
  },

  pages: { signIn: ROUTES.SIGNIN, error: ROUTES.SIGNIN },

  secret: process.env.NEXTAUTH_SECRET,
};
