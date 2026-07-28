import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { ownerKeys } from "./use-customer";

export interface RestaurantImage {
  id: number;
  image: string;
}

export function useUploadRestaurantImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("image", file);
      const r = await apiClient.post("/api/app/restaurant/images/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return r.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ownerKeys.profile() });
    },
  });
}

export function useDeleteRestaurantImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/app/restaurant/images/${id}/`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ownerKeys.profile() });
    },
  });
}
