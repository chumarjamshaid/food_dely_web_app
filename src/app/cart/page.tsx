"use client";

import SafeImage from "@/components/SafeImage";
import {
  useCart,
  useApplyPromoCode,
  useRemoveFromCart,
  useRemovePromoCode,
  useUpdateCartItem,
} from "@/lib/api";
import { extractAuthError } from "@/lib/api/error";
import type { CartItemResponse } from "@/lib/api/types";
import { clearCartRestaurantId } from "@/lib/cart-restaurant";
import { getCartTotal } from "@/lib/cart-total";
import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { data: cart, isLoading, error: cartError, refetch } = useCart();
  const removeItem = useRemoveFromCart();
  const updateItem = useUpdateCartItem();
  const [actionItemId, setActionItemId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const applyPromo = useApplyPromoCode();
  const removePromo = useRemovePromoCode();

  useEffect(() => {
    if (cart?.items.length === 0) clearCartRestaurantId();
  }, [cart?.items.length]);

  const changeQuantity = (cartItem: CartItemResponse, quantity: number) => {
    setActionError("");
    setActionItemId(cartItem.id);

    if (quantity <= 0) {
      removeItem.mutate(cartItem.id, {
        onSettled: () => setActionItemId(null),
        onError: (mutationError) =>
          setActionError(
            extractAuthError(mutationError, "This item could not be removed."),
          ),
      });
      return;
    }

    updateItem.mutate(
      { cartItem, quantity },
      {
        onSettled: () => setActionItemId(null),
        onError: (mutationError) =>
          setActionError(
            extractAuthError(
              mutationError,
              "The quantity could not be updated.",
            ),
          ),
      },
    );
  };

  const removeCartItem = (cartItemId: number) => {
    setActionError("");
    setActionItemId(cartItemId);
    removeItem.mutate(cartItemId, {
      onSettled: () => setActionItemId(null),
      onError: (mutationError) =>
        setActionError(
          extractAuthError(mutationError, "This item could not be removed."),
        ),
    });
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaf8]">
        <div className="flex items-center gap-3 text-sm font-bold text-[#6d625c]">
          <LoaderCircle className="animate-spin text-[#c83b2b]" />
          Loading your cart…
        </div>
      </main>
    );
  }

  const itemCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const total = getCartTotal(cart);
  const money = (value: string | number | undefined) => Number(value ?? 0).toFixed(2);

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#241f1c]">
      <header className="border-b border-[#ece3de] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-6xl items-center justify-between px-4 sm:px-8">
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-[#665b55] transition hover:bg-[#f7f1ee] hover:text-[#b63825]"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Continue browsing</span>
          </Link>
          <Link href="/" className="text-[24px] font-black tracking-[-0.04em]">
            <span className="text-[#c83b2b]">FOOD</span>DELY
          </Link>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0eb] text-[#b63825]">
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c83b2b] px-1 text-[10px] font-black text-white">
                {itemCount}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#b63825]">
            Your order
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Review your cart
          </h1>
          <p className="mt-2 text-sm text-[#7d716a]">
            Quantities and removals are saved directly to your cart.
          </p>
        </div>

        {(actionError || cartError) && (
          <div
            role="alert"
            className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            <span>
              {actionError ||
                "Your cart could not be loaded. Please try again."}
            </span>
            {cartError && (
              <button type="button" onClick={() => refetch()} className="underline">
                Retry
              </button>
            )}
          </div>
        )}

        {!cart?.items.length ? (
          <section className="mt-8 rounded-[28px] border border-dashed border-[#d9cac3] bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff0eb] text-[#c83b2b]">
              <ShoppingBag size={29} />
            </div>
            <h2 className="mt-5 text-2xl font-black">Your cart is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7d716a]">
              Browse restaurants and add something delicious to begin your
              order.
            </p>
            <Link
              href="/partners"
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#c83b2b] px-6 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#ad321f]"
            >
              Browse restaurants
              <ArrowRight size={18} />
            </Link>
          </section>
        ) : (
          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
            <section className="space-y-3">
              {cart.items.map((cartItem) => {
                const item = cartItem.menu_item || cartItem.nowaste_item;
                if (!item) return null;
                const isPending = actionItemId === cartItem.id;

                return (
                  <article
                    key={cartItem.id}
                    className="group grid grid-cols-[88px_1fr] gap-4 rounded-[22px] border border-[#e9dfda] bg-white p-4 shadow-[0_10px_30px_rgba(55,35,27,0.05)] transition duration-300 hover:border-[#e3b9ae] hover:shadow-[0_18px_42px_rgba(55,35,27,0.09)] sm:grid-cols-[110px_1fr_auto] sm:items-center sm:p-5"
                  >
                    <div className="relative h-[88px] overflow-hidden rounded-2xl bg-[#fff8f5] sm:h-[100px]">
                      <SafeImage
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="110px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                        fallbackClassName="object-contain p-5"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-black tracking-tight">
                          {item.name}
                        </h2>
                        {cartItem.nowaste_item && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            No Waste
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-bold text-[#b63825]">
                        {Number(item.price).toFixed(2)} CHF each
                      </p>
                      {!!cartItem.options?.length && (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#81746d]">
                          <SlidersHorizontal size={14} />
                          Customized · {cartItem.options.length}{" "}
                          {cartItem.options.length === 1 ? "option" : "options"}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2 flex items-center justify-between gap-4 border-t border-[#eee6e2] pt-4 sm:col-span-1 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                      <p className="text-lg font-black">
                        {(Number(item.price) * cartItem.quantity).toFixed(2)} CHF
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 items-center rounded-xl border border-[#ddd2cc] bg-[#fbf8f6]">
                          <button
                            type="button"
                            aria-label={`Decrease ${item.name} quantity`}
                            disabled={isPending}
                            onClick={() =>
                              changeQuantity(cartItem, cartItem.quantity - 1)
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white disabled:opacity-50"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="min-w-8 text-center text-sm font-black">
                            {isPending ? (
                              <LoaderCircle
                                size={16}
                                className="mx-auto animate-spin text-[#c83b2b]"
                              />
                            ) : (
                              cartItem.quantity
                            )}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase ${item.name} quantity`}
                            disabled={isPending}
                            onClick={() =>
                              changeQuantity(cartItem, cartItem.quantity + 1)
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white disabled:opacity-50"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          disabled={isPending}
                          onClick={() => removeCartItem(cartItem.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#968982] transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="rounded-[24px] border border-[#e4d8d2] bg-[#241b18] p-6 text-white shadow-[0_22px_55px_rgba(42,28,22,0.18)] lg:sticky lg:top-6">
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#ff9b8f]">
                Order summary
              </p>
              <div className="mt-5 flex items-center justify-between border-b border-white/10 pb-5 text-sm text-stone-300">
                <span>
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
                <span>{total.toFixed(2)} CHF</span>
              </div>
              <div className="space-y-2 border-b border-white/10 py-5 text-sm">
                <div className="flex justify-between text-stone-300"><span>Subtotal</span><span>{money(cart.subtotal)} CHF</span></div>
                {Number(cart.restaurant_discount)>0&&<div className="flex justify-between text-emerald-300"><span>Restaurant discount</span><span>−{money(cart.restaurant_discount)} CHF</span></div>}
                {Number(cart.delivery_fee)>0&&<div className="flex justify-between text-stone-300"><span>Delivery</span><span>{money(cart.delivery_fee)} CHF</span></div>}
                {Number(cart.promo_discount)>0&&<div className="flex justify-between text-emerald-300"><span>Promo discount</span><span>−{money(cart.promo_discount)} CHF</span></div>}
              </div>
              <div className="border-b border-white/10 py-5">
                {cart.promo_code?<div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-3 text-sm"><span><strong>{cart.promo_code}</strong> applied</span><button onClick={()=>removePromo.mutate()} className="font-bold text-[#ff9b8f]">Remove</button></div>:<div className="flex gap-2"><input value={promoCode} onChange={e=>setPromoCode(e.target.value)} placeholder="Promo code" className="h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white placeholder:text-stone-500 outline-none focus:border-[#ff9b8f]"/><button disabled={!promoCode.trim()||applyPromo.isPending} onClick={()=>applyPromo.mutate(promoCode,{onError:e=>setActionError(extractAuthError(e,"This promo code could not be applied."))})} className="rounded-xl bg-white px-4 text-sm font-black text-[#241b18] disabled:opacity-50">Apply</button></div>}
                {cart.promo_error&&<p className="mt-2 text-xs text-[#ff9b8f]">{cart.promo_error}</p>}
              </div>
              <div className="flex items-center justify-between py-5 text-xl font-black">
                <span>Cart total</span>
                <span>{total.toFixed(2)} CHF</span>
              </div>
              <p className="text-xs leading-5 text-stone-400">
                Delivery fees, eligible discounts, and the final payable amount
                are confirmed securely during checkout.
              </p>
              <Link
                href="/payment"
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#c83b2b] px-5 font-bold transition hover:-translate-y-0.5 hover:bg-[#ad321f] hover:shadow-lg"
              >
                Continue to checkout
                <ArrowRight size={18} />
              </Link>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-stone-400">
                <ShieldCheck size={15} />
                Secure checkout
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
