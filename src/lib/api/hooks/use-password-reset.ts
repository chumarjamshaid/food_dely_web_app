import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../client";

export type PasswordResetAccount = "customer" | "restaurant";

function resetBase(account: PasswordResetAccount) {
  return `/api/app/${account}/password/reset`;
}

export function useRequestPasswordReset(account: PasswordResetAccount = "customer") {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await apiClient.post<{ detail: string }>(`${resetBase(account)}/`, { email: email.trim().toLowerCase() });
      return data;
    },
  });
}

export function useValidatePasswordReset(account: PasswordResetAccount = "customer") {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await apiClient.post<{ valid: boolean }>(`${resetBase(account)}/validate/`, { token });
      return data;
    },
  });
}

export function useConfirmPasswordReset(account: PasswordResetAccount = "customer") {
  return useMutation({
    mutationFn: async (payload: { token: string; password: string; password_confirm: string }) => {
      const { data } = await apiClient.post<{ detail?: string }>(`${resetBase(account)}/confirm/`, payload);
      return data;
    },
  });
}
