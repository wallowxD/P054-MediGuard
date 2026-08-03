/** React Query hooks cho auth. Đăng nhập đi qua NextAuth `signIn`, không qua đây. */

import { useMutation, useQuery } from "@tanstack/react-query";
import { getProfileRequest, registerRequest } from "@/services/auth";

export const authKeys = {
  all: ["auth"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
};

export const useProfile = (enabled: boolean = true) =>
  useQuery({
    queryKey: authKeys.profile(),
    queryFn: getProfileRequest,
    enabled,
    staleTime: 5 * 60 * 1000,
  });

export const useRegister = () =>
  useMutation({
    mutationFn: (data: IRegisterRequest) => registerRequest(data),
  });
