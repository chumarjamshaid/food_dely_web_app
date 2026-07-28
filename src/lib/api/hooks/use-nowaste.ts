import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import type { AllergyRef, MenuItem } from "./use-menu";

// ---------- Types ----------

export interface NowasteCustomItem {
  id: number;
  name: string;
  description: string;
  quantity: number;
}

export interface NowasteMenuItemLink {
  id: number;
  quantity: number;
  menu_item: MenuItem;
}

export interface NowasteItem {
  id: number;
  name: string;
  description: string;
  price: string | number;
  active: boolean;
  amount_available: number;
  allergies: AllergyRef[] | number[];
  nowaste_items_menu_item: NowasteMenuItemLink[];
  nowaste_items_custom: NowasteCustomItem[];
}

export interface NowasteItemCreatePayload {
  name: string;
  description: string;
  price: number;
  amount_available?: number;
  allergies: number[];
}

export interface NowasteItemUpdatePayload {
  name: string;
  description: string;
  price: number;
  active: boolean;
  amount_available: number;
  allergies: number[];
}

export interface NowasteCustomPayload {
  name: string;
  description: string;
  quantity?: number;
}

export interface NowasteMenuItemLinkPayload {
  menu_item: number;
  quantity: number;
}

// ---------- Keys ----------

export const nowasteKeys = {
  all: ["nowaste-items"] as const,
  detail: (id: number) => ["nowaste-items", id] as const,
};

// ---------- Helpers ----------

function postMultipart<T>(url: string, data: unknown) {
  const fd = new FormData();
  fd.append("data", JSON.stringify(data));
  return apiClient.post<T>(url, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

// ---------- Nowaste items ----------

export function useNowasteItems(enabled = true) {
  return useQuery({
    queryKey: nowasteKeys.all,
    queryFn: async () => {
      const r = await apiClient.get<NowasteItem[]>(
        "/api/app/restaurant/nowaste-items/",
      );
      return r.data;
    },
    enabled,
  });
}

export function useNowasteItem(id: number | null, enabled = true) {
  return useQuery({
    queryKey: id ? nowasteKeys.detail(id) : ["nowaste-items", "none"],
    queryFn: async () => {
      const r = await apiClient.get<NowasteItem>(
        `/api/app/restaurant/nowaste-items/${id}/`,
      );
      return r.data;
    },
    enabled: enabled && !!id,
  });
}

export function useCreateNowasteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: NowasteItemCreatePayload) => {
      const r = await postMultipart<NowasteItem>(
        "/api/app/restaurant/nowaste-items/",
        data,
      );
      return r.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: nowasteKeys.all }),
  });
}

export function useUpdateNowasteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: number; data: NowasteItemUpdatePayload }) => {
      const r = await postMultipart<NowasteItem>(
        `/api/app/restaurant/nowaste-items/${args.id}/`,
        args.data,
      );
      return r.data;
    },
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: nowasteKeys.all });
      if (item?.id) {
        qc.invalidateQueries({ queryKey: nowasteKeys.detail(item.id) });
      }
    },
  });
}

export function useDeleteNowasteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/app/restaurant/nowaste-items/${id}/`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: nowasteKeys.all }),
  });
}

// ---------- Custom items ----------

function customUrl(nowasteId: number, customId?: number) {
  const base = `/api/app/restaurant/nowaste-items/${nowasteId}/nowaste-items-custom/`;
  return customId ? `${base}${customId}/` : base;
}

export function useCreateNowasteCustom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { nowasteId: number; data: NowasteCustomPayload }) => {
      const r = await postMultipart<NowasteCustomItem>(
        customUrl(args.nowasteId),
        args.data,
      );
      return r.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: nowasteKeys.all });
      qc.invalidateQueries({ queryKey: nowasteKeys.detail(vars.nowasteId) });
    },
  });
}

export function useUpdateNowasteCustom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      nowasteId: number;
      customId: number;
      data: NowasteCustomPayload;
    }) => {
      const r = await postMultipart<NowasteCustomItem>(
        customUrl(args.nowasteId, args.customId),
        args.data,
      );
      return r.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: nowasteKeys.all });
      qc.invalidateQueries({ queryKey: nowasteKeys.detail(vars.nowasteId) });
    },
  });
}

export function useDeleteNowasteCustom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { nowasteId: number; customId: number }) => {
      await apiClient.delete(customUrl(args.nowasteId, args.customId));
      return args;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: nowasteKeys.all });
      qc.invalidateQueries({ queryKey: nowasteKeys.detail(vars.nowasteId) });
    },
  });
}

// ---------- Linked menu items ----------

function linkUrl(nowasteId: number, linkId?: number) {
  const base = `/api/app/restaurant/nowaste-items/${nowasteId}/nowaste-items-menu-item/`;
  return linkId ? `${base}${linkId}/` : base;
}

export function useCreateNowasteMenuItemLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      nowasteId: number;
      data: NowasteMenuItemLinkPayload;
    }) => {
      const r = await postMultipart<NowasteMenuItemLink>(
        linkUrl(args.nowasteId),
        args.data,
      );
      return r.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: nowasteKeys.all });
      qc.invalidateQueries({ queryKey: nowasteKeys.detail(vars.nowasteId) });
    },
  });
}

export function useUpdateNowasteMenuItemLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      nowasteId: number;
      linkId: number;
      data: NowasteMenuItemLinkPayload;
    }) => {
      const r = await postMultipart<NowasteMenuItemLink>(
        linkUrl(args.nowasteId, args.linkId),
        args.data,
      );
      return r.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: nowasteKeys.all });
      qc.invalidateQueries({ queryKey: nowasteKeys.detail(vars.nowasteId) });
    },
  });
}

export function useDeleteNowasteMenuItemLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { nowasteId: number; linkId: number }) => {
      await apiClient.delete(linkUrl(args.nowasteId, args.linkId));
      return args;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: nowasteKeys.all });
      qc.invalidateQueries({ queryKey: nowasteKeys.detail(vars.nowasteId) });
    },
  });
}
