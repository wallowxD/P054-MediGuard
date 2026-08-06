export {};

declare global {
  interface IAuthUser {
    id: string;
    email: string;
    name: string;
    roles: string[];
  }

  interface ILoginRequest {
    email: string;
    password: string;
  }

  /** Body của `POST /api/v1/auth/google` — xem ADR 0016. */
  interface IGoogleLoginRequest {
    idToken: string;
  }

  interface ILoginResponse {
    accessToken: string;
    refreshToken: string;
    /** Số giây còn lại của accessToken — dùng để lên lịch refresh trước khi hết hạn. */
    expiresIn: number;
    user: IAuthUser;
  }

  interface IRegisterRequest {
    email: string;
    password: string;
    name: string;
  }

  interface IRefreshTokenRequest {
    refreshToken: string;
  }

  /** `/auth/refresh` KHÔNG trả `user` — lúc refresh client đã có hồ sơ rồi. */
  interface IRefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }
}
