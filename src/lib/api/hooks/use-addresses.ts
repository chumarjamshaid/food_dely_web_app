import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import type { CreateCustomerAddressRequest, CustomerAddress, UpdateCustomerAddressRequest } from "../types";
import { customerKeys } from "./use-customer";

// Query keys for addresses
export const addressKeys = {
  all: ["addresses"] as const,
  list: () => [...addressKeys.all, "list"] as const,
};

// Fetch all customer addresses (requires JWT)
async function fetchAddresses(): Promise<CustomerAddress[]> {
  const response = await apiClient.get<CustomerAddress[]>(
    "/api/app/customer/addresses/"
  );
  return response.data;
}

// Create a new customer address
async function createAddress(
  data: CreateCustomerAddressRequest
): Promise<CustomerAddress> {
  const formData = new FormData();
  formData.append("data", JSON.stringify(data));

  const response = await apiClient.post<CustomerAddress>(
    "/api/app/customer/addresses/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

// Delete a customer address
async function deleteAddress(id: number): Promise<CustomerAddress[]> {
  const response = await apiClient.delete<CustomerAddress[]>(
    `/api/app/customer/addresses/${id}/`
  );
  return response.data;
}

async function updateAddress(id: number, data: UpdateCustomerAddressRequest): Promise<CustomerAddress> {
  const formData = new FormData();
  formData.append("data", JSON.stringify(data));
  const response = await apiClient.patch<CustomerAddress>(
    `/api/app/customer/addresses/${id}/`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}

/**
 * Hook to fetch all addresses for the authenticated customer
 * Requires JWT authentication
 */
export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: addressKeys.list(),
    queryFn: fetchAddresses,
    enabled,
    retry: (failureCount, error) => {
      // @ts-expect-error - axios error has response
      if (error?.response?.status === 401) return false;
      return failureCount < 3;
    },
  });
}

/**
 * Hook to create a new customer address
 * Requires JWT authentication
 */
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAddress,
    onSuccess: (data) => {
      // Invalidate addresses list to refetch
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
      // If this is set as default, it might affect customer profile
      if (data.default) {
        queryClient.invalidateQueries({ queryKey: customerKeys.profile() });
      }
    },
  });
}

/**
 * Hook to delete a customer address
 * Requires JWT authentication
 * Note: Customer must always have at least one address
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      // Invalidate addresses list to refetch
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCustomerAddressRequest }) => updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
      queryClient.invalidateQueries({ queryKey: customerKeys.profile() });
    },
  });
}
