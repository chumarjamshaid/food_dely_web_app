import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../client";

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await apiClient.post<{ detail: string }>("/api/app/customer/password/reset/", { email: email.trim().toLowerCase() });
      return data;
    },
  });
}

export function useValidatePasswordReset() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await apiClient.post<{ valid: boolean }>("/api/app/customer/password/reset/validate/", { token });
      return data;
    },
  });
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: async (payload: { token: string; password: string; password_confirm: string }) => {
      const { data } = await apiClient.post<{ detail?: string }>("/api/app/customer/password/reset/confirm/", payload);
      return data;
    },
  });
}
