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

  interface ILoginResponse {
    accessToken: string;
    refreshToken: string;
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

  interface IRefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
  }
}
