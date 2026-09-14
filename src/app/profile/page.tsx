"use client";
import { useAddresses, useCustomerProfile, useOrderDetail, useOrders, useRestaurantCatalog } from "@/lib/api";
import type { OrderListItem, RestaurantDetailResponse } from "@/lib/api/types";
import "@fontsource/abril-fatface";
import Link from "next/link";
import { getOrderRestaurantName, getOrderRestaurantNameFromCatalog } from "@/lib/order-restaurant";
import { ArrowLeft } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ProfilePage() {
  // const router = useRouter();
  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useCustomerProfile();
  const { data: addresses, isLoading: isLoadingAddresses } = useAddresses();
  const { data: orders, isLoading: isLoadingOrders } = useOrders();
  const { data: restaurantCatalog } = useRestaurantCatalog();

  if (isLoadingProfile) {
    return <LoadingSpinner label="Loading profile…" fullScreen />;
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please Sign In</h1>
          <p className="text-gray-300 mb-6">You need to be signed in to view your profile.</p>
          <Link
            href="/signin"
            className="bg-[#CD3625] text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 transition inline-block"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/partners"
            className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-semibold text-gray-200 transition hover:border-gray-500 hover:bg-white/10"
          >
            <ArrowLeft size={18} />
            Back to restaurants
          </Link>
          <div
            className="text-[32px] font-extrabold mb-2"
            style={{ fontFamily: "Abril Fatface, serif" }}
          >
            <span className="text-red-600">FOOD</span>
            <span className="text-white">DELY</span>
          </div>
          <h1 className="text-3xl font-bold mt-4">My Profile</h1>
        </div>

        {/* Profile Information */}
        <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-2xl p-6 border border-gray-600 mb-6">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  First Name
                </label>
                <div className="text-white font-medium">{profile.firstname}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Last Name
                </label>
                <div className="text-white font-medium">{profile.lastname}</div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <div className="text-white font-medium">{profile.email}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Phone
              </label>
              <div className="text-white font-medium">{profile.phone}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Birthday
              </label>
              <div className="text-white font-medium">
                {new Date(profile.birthday).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-2xl p-6 border border-gray-600 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Saved Addresses</h2>
            <Link
              href="/address"
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              Manage Addresses
            </Link>
          </div>
          {isLoadingAddresses ? (
            <LoadingSpinner label="Loading addresses…" className="justify-start text-gray-400" />
          ) : addresses && addresses.length > 0 ? (
            <div className="space-y-3">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="p-4 bg-black bg-opacity-20 rounded-lg border border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-medium">{address.address}</div>
                      <div className="text-gray-400 text-sm">
                        {address.postal_code} {address.city}
                      </div>
                    </div>
                    {address.default && (
                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400">No saved addresses</div>
          )}
        </div>

        {/* Order History */}
        <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-2xl p-6 border border-gray-600">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Order History</h2>
            <Link
              href="/orders"
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          {isLoadingOrders ? (
            <LoadingSpinner label="Loading orders…" className="justify-start text-gray-400" />
          ) : orders && orders.length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block p-4 bg-black bg-opacity-20 rounded-lg border border-gray-700 hover:border-red-500 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-medium">Order #{order.id}</div>
                      <ProfileOrderRestaurantName order={order} restaurantCatalog={restaurantCatalog} />
                      <div className="text-gray-400 text-sm">
                        {order.placed || (order.created_at ? new Date(order.created_at).toLocaleDateString() : "Recently")}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        ${parseFloat(order.price.toString()).toFixed(2)}
                      </div>
                      <div
                        className={`text-sm mt-1 ${
                          order.status === "completed"
                            ? "text-green-400"
                            : order.status === "can_cust" || order.status === "can_rest"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {order.status}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-gray-400">No orders yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileOrderRestaurantName({
  order,
  restaurantCatalog,
}: {
  order: OrderListItem;
  restaurantCatalog: RestaurantDetailResponse[] | undefined;
}) {
  const listName = getOrderRestaurantName(order);
  const needsDetail = listName === "Restaurant name unavailable";
  const { data: detail, isLoading } = useOrderDetail(needsDetail ? order.id : 0);
  const detailName = detail ? getOrderRestaurantName(detail) : null;
  const catalogName = getOrderRestaurantNameFromCatalog(detail ?? order, restaurantCatalog);

  return (
    <div className="text-red-400 text-sm font-medium">
      {needsDetail
        ? detailName && detailName !== "Restaurant name unavailable"
          ? detailName
          : catalogName ?? (isLoading ? "Loading restaurant…" : "Restaurant")
        : listName}
    </div>
  );
}
