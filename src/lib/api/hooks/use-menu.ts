import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

// ---------- Types ----------

export interface Food {
  id: number;
  name: string;
  description: string;
  image: string | null;
}

export interface AllergyRef {
  id: number;
  name?: string;
}

export interface MenuItemOptionItem {
  id: number;
  name: string;
  description: string;
  price: string | number;
  allergies: AllergyRef[] | number[];
}

export interface MenuItemOption {
  id: number;
  name: string;
  multiple: boolean;
  required: boolean;
  items?: MenuItemOptionItem[];
  option_items?: MenuItemOptionItem[];
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string | number;
  active: boolean;
  popular?: boolean;
  image: string | null;
  food: Food | null;
  options: MenuItemOption[];
  allergies: AllergyRef[] | number[];
}

export interface FoodPayload {
  name: string;
  description: string;
}

export interface MenuItemPayload {
  name: string;
  description: string;
  price: number;
  active: boolean;
  popular?: boolean;
  food: number;
  allergies: number[];
}

export interface MenuItemOptionPayload {
  name: string;
  multiple: boolean;
  required: boolean;
}

export interface MenuItemOptionItemPayload {
  name: string;
  description: string;
  price: number;
  allergies: number[];
}

// ---------- Keys ----------

export const foodsKeys = {
  all: ["foods"] as const,
};

export const menuItemsKeys = {
  all: ["menu-items"] as const,
  detail: (id: number) => ["menu-items", id] as const,
};

// ---------- Helpers ----------

function postMultipart<T>(url: string, data: unknown) {
  const fd = new FormData();
  fd.append("data", JSON.stringify(data));
  return apiClient.post<T>(url, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

// ---------- Foods ----------

export function useFoods(enabled = true) {
  return useQuery({
    queryKey: foodsKeys.all,
    queryFn: async () => {
      const r = await apiClient.get<Food[]>("/api/app/restaurant/foods/");
      return r.data;
    },
    enabled,
  });
}

export function useCreateFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: FoodPayload) => {
      const r = await postMultipart<Food>(
        "/api/app/restaurant/foods/",
        data,
      );
      return r.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: foodsKeys.all }),
  });
}

// ---------- Menu items ----------

export function useMenuItems(enabled = true) {
  return useQuery({
    queryKey: menuItemsKeys.all,
    queryFn: async () => {
      const r = await apiClient.get<MenuItem[]>(
        "/api/app/restaurant/menu-items/",
      );
      return r.data;
    },
    enabled,
  });
}

export function useMenuItem(id: number | null, enabled = true) {
  return useQuery({
    queryKey: id ? menuItemsKeys.detail(id) : ["menu-items", "none"],
    queryFn: async () => {
      const r = await apiClient.get<MenuItem>(
        `/api/app/restaurant/menu-items/${id}/`,
      );
      return r.data;
    },
    enabled: enabled && !!id,
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MenuItemPayload) => {
      const r = await postMultipart<MenuItem>(
        "/api/app/restaurant/menu-items/",
        data,
      );
      return r.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: menuItemsKeys.all }),
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: number; data: MenuItemPayload }) => {
      const r = await postMultipart<MenuItem>(
        `/api/app/restaurant/menu-items/${args.id}/`,
        args.data,
      );
      return r.data;
    },
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: menuItemsKeys.all });
      if (item?.id) {
        qc.invalidateQueries({ queryKey: menuItemsKeys.detail(item.id) });
      }
    },
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/app/restaurant/menu-items/${id}/`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: menuItemsKeys.all }),
  });
}

export function useUploadMenuItemImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: number; file: File }) => {
      const fd = new FormData();
      fd.append("image", args.file);
      const r = await apiClient.post<MenuItem>(
        `/api/app/restaurant/menu-items/${args.id}/image/`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return r.data;
    },
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: menuItemsKeys.all });
      if (item?.id) {
        qc.invalidateQueries({ queryKey: menuItemsKeys.detail(item.id) });
      }
    },
  });
}

// ---------- Menu item option groups ----------

export function useCreateMenuItemOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      menuItemId: number;
      data: MenuItemOptionPayload;
    }) => {
      const r = await postMultipart<MenuItemOption>(
        `/api/app/restaurant/menu-items/${args.menuItemId}/menu-item-options/`,
        args.data,
      );
      return r.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: menuItemsKeys.all });
      qc.invalidateQueries({
        queryKey: menuItemsKeys.detail(vars.menuItemId),
      });
    },
  });
}

export function useUpdateMenuItemOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      menuItemId: number;
      optionId: number;
      data: MenuItemOptionPayload;
    }) => {
      const r = await postMultipart<MenuItemOption>(
        `/api/app/restaurant/menu-items/${args.menuItemId}/menu-item-options/${args.optionId}/`,
        args.data,
      );
      return r.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: menuItemsKeys.all });
      qc.invalidateQueries({
        queryKey: menuItemsKeys.detail(vars.menuItemId),
      });
    },
  });
}

export function useDeleteMenuItemOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { menuItemId: number; optionId: number }) => {
      await apiClient.delete(
        `/api/app/restaurant/menu-items/${args.menuItemId}/menu-item-options/${args.optionId}/`,
      );
      return args;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: menuItemsKeys.all });
      qc.invalidateQueries({
        queryKey: menuItemsKeys.detail(vars.menuItemId),
      });
    },
  });
}

// ---------- Menu item option items ----------

function optionItemUrl(menuItemId: number, optionId: number, itemId?: number) {
  const base = `/api/app/restaurant/menu-items/${menuItemId}/menu-item-options/${optionId}/menu-item-option-items/`;
  return itemId ? `${base}${itemId}/` : base;
}

export function useCreateMenuItemOptionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      menuItemId: number;
      optionId: number;
      data: MenuItemOptionItemPayload;
    }) => {
      const r = await postMultipart<MenuItemOptionItem>(
        optionItemUrl(args.menuItemId, args.optionId),
        args.data,
      );
      return r.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: menuItemsKeys.all });
      qc.invalidateQueries({
        queryKey: menuItemsKeys.detail(vars.menuItemId),
      });
    },
  });
}

export function useUpdateMenuItemOptionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      menuItemId: number;
      optionId: number;
      itemId: number;
      data: MenuItemOptionItemPayload;
    }) => {
      const r = await postMultipart<MenuItemOptionItem>(
        optionItemUrl(args.menuItemId, args.optionId, args.itemId),
        args.data,
      );
      return r.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: menuItemsKeys.all });
      qc.invalidateQueries({
        queryKey: menuItemsKeys.detail(vars.menuItemId),
      });
    },
  });
}

export function useDeleteMenuItemOptionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      menuItemId: number;
      optionId: number;
      itemId: number;
    }) => {
      await apiClient.delete(
        optionItemUrl(args.menuItemId, args.optionId, args.itemId),
      );
      return args;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: menuItemsKeys.all });
      qc.invalidateQueries({
        queryKey: menuItemsKeys.detail(vars.menuItemId),
      });
    },
  });
}
