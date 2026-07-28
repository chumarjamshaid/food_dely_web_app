import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiClient,
  clearAuthToken,
  hasAuthToken,
  setAuthToken,
} from "../client";
import { clearSessionId } from "../session";
import type {
  CustomerProfile,
  CustomerRegisterData,
  RestaurantOwnerProfile,
} from "../types";

// Query keys for customer
export const customerKeys = {
  all: ["customer"] as const,
  profile: () => [...customerKeys.all, "profile"] as const,
};

// Fetch customer profile (requires JWT)
async function fetchCustomerProfile(): Promise<CustomerProfile> {
  const response = await apiClient.get<CustomerProfile>("/api/app/customer/");
  return response.data;
}

// Register new customer
async function registerCustomer(
  data: CustomerRegisterData,
): Promise<CustomerProfile> {
  // Backend expects form-data with a 'data' field containing JSON
  const formData = new FormData();
  formData.append("data", JSON.stringify(data));

  const response = await apiClient.post<CustomerProfile>(
    "/api/app/customer/register/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

/**
 * Hook to fetch the authenticated customer's profile
 * Only fetches if user has auth token
 */
export function useCustomerProfile(enabled = true) {
  return useQuery({
    queryKey: customerKeys.profile(),
    queryFn: fetchCustomerProfile,
    enabled,
    // Don't retry on 401 errors
    retry: (failureCount, error) => {
      // @ts-expect-error - axios error has response
      if (error?.response?.status === 401) return false;
      return failureCount < 3;
    },
  });
}

/**
 * Hook to register a new customer
 */
export function useRegisterCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerCustomer,
    onSuccess: (data) => {
      // Optionally set the profile in cache after registration
      queryClient.setQueryData(customerKeys.profile(), data);
    },
  });
}

/**
 * Hook to handle login using POST /api/token to retrieve JWT access token
 */
interface LoginCredentials {
  username: string;
  password: string;
}

interface TokenResponse {
  access?: string;
  access_token?: string;
  token?: string;
  // Handle various response formats
}

// Token response can include a `user` field hinting at role; we also
// fall back to probing the restaurant endpoint, since the docs guarantee
// it returns 404 (api.restaurant_not_found) for non-owners.
interface TokenUserHint {
  type?: string;
  role?: string;
  is_restaurant_owner?: boolean;
  is_owner?: boolean;
}
interface TokenResponseWithUser extends TokenResponse {
  user?: TokenUserHint;
  user_type?: string;
  is_restaurant_owner?: boolean;
}

export type LoginRole = "customer" | "restaurant_owner";
export interface LoginResult {
  role: LoginRole;
  customer?: CustomerProfile;
  restaurant?: RestaurantOwnerProfile;
}

function detectOwnerHint(data: TokenResponseWithUser): boolean | null {
  const u = data.user;
  if (u) {
    if (u.is_restaurant_owner === true || u.is_owner === true) return true;
    const flag = (u.type || u.role || "").toLowerCase();
    if (flag.includes("restaurant") || flag === "owner") return true;
    if (flag === "customer") return false;
  }
  if (data.is_restaurant_owner === true) return true;
  const ut = (data.user_type || "").toLowerCase();
  if (ut.includes("restaurant") || ut === "owner") return true;
  if (ut === "customer") return false;
  return null; // unknown — caller will probe
}

async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const tokenResponse = await apiClient.post<TokenResponseWithUser>(
    "/api/token/",
    credentials,
  );

  const token =
    tokenResponse.data.access ||
    tokenResponse.data.access_token ||
    tokenResponse.data.token;

  if (!token) {
    throw new Error("Token not found in response");
  }

  setAuthToken(token);

  const ownerHint = detectOwnerHint(tokenResponse.data);

  // If the hint says owner, fetch restaurant profile.
  if (ownerHint === true) {
    const r = await apiClient.get<RestaurantOwnerProfile>(
      "/api/app/restaurant/",
    );
    return { role: "restaurant_owner", restaurant: r.data };
  }

  // If the hint says customer, fetch customer profile.
  if (ownerHint === false) {
    const c = await apiClient.get<CustomerProfile>("/api/app/customer/");
    return { role: "customer", customer: c.data };
  }

  // Unknown role — probe restaurant endpoint first; on 404 fall back to customer.
  try {
    const r = await apiClient.get<RestaurantOwnerProfile>(
      "/api/app/restaurant/",
    );
    return { role: "restaurant_owner", restaurant: r.data };
  } catch (err) {
    const e = err as { response?: { status?: number } };
    if (e?.response?.status !== 404) throw err;
    const c = await apiClient.get<CustomerProfile>("/api/app/customer/");
    return { role: "customer", customer: c.data };
  }
}

// Query key for restaurant owner profile
export const ownerKeys = {
  all: ["restaurant-owner"] as const,
  profile: () => [...ownerKeys.all, "profile"] as const,
};

/**
 * Hook to fetch the authenticated restaurant owner's profile.
 */
export function useRestaurantOwnerProfile(enabled = true) {
  return useQuery({
    queryKey: ownerKeys.profile(),
    queryFn: async () => {
      const r = await apiClient.get<RestaurantOwnerProfile>(
        "/api/app/restaurant/",
      );
      return r.data;
    },
    enabled,
    retry: (failureCount, error) => {
      const e = error as { response?: { status?: number } };
      if (e?.response?.status === 401 || e?.response?.status === 404)
        return false;
      return failureCount < 3;
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      clearSessionId();
      if (result.role === "customer" && result.customer) {
        queryClient.setQueryData(customerKeys.profile(), result.customer);
      }
      if (result.role === "restaurant_owner" && result.restaurant) {
        queryClient.setQueryData(ownerKeys.profile(), result.restaurant);
      }
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

/**
 * Hook to handle logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    // Clear auth token
    clearAuthToken();
    // Clear customer profile from cache
    queryClient.removeQueries({ queryKey: customerKeys.all });
    // Clear cart and other user-specific data
    queryClient.clear();
  };
}

/**
 * Hook to check if user is authenticated
 */
export function useAuth() {
  const { data: profile, isLoading } = useCustomerProfile(hasAuthToken());
  const isAuthenticated = !!profile && hasAuthToken();

  return {
    isAuthenticated,
    isLoading,
    user: profile || null,
  };
}
