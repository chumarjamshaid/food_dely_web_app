"use client";

import { useConfirmPasswordReset, useValidatePasswordReset } from "@/lib/api";
import { extractAuthError } from "@/lib/api/error";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

function OwnerResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const validate = useValidatePasswordReset("restaurant");
  const confirm = useConfirmPasswordReset("restaurant");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => { if (token) validate.mutate(token); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  const invalid = !token || validate.isError || validate.data?.valid === false;
  const submit = (event: FormEvent) => {
    event.preventDefault(); setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== again) return setError("Passwords do not match.");
    confirm.mutate({ token, password, password_confirm: again }, { onSuccess: () => setDone(true), onError: (requestError) => setError(extractAuthError(requestError, "This reset link could not be used.")) });
  };
  return <section className="w-full rounded-[30px] border border-[#eadfd9] bg-white p-8 shadow-[0_30px_90px_rgba(66,39,29,.12)]"><p className="text-xs font-black uppercase tracking-[.16em] text-[#b63825]">Restaurant owner</p><h1 className="mt-2 text-3xl font-black">{done ? "Password updated" : invalid ? "Link unavailable" : "Choose a new password"}</h1>{validate.isPending ? <p className="mt-5 flex items-center gap-2 text-sm"><LoaderCircle className="animate-spin" size={17}/>Checking your secure link…</p> : done ? <><p className="mt-3 text-sm text-gray-600">You can now sign in with your new password.</p><Link href="/signin" className="mt-7 flex h-13 items-center justify-center rounded-xl bg-[#c83f28] font-bold text-white">Continue to sign in</Link></> : invalid ? <><p className="mt-3 text-sm text-gray-600">This reset link is invalid or expired.</p><Link href="/forgot-password" className="mt-7 flex h-13 items-center justify-center rounded-xl bg-[#c83f28] font-bold text-white">Request another link</Link></> : <form onSubmit={submit} className="mt-7 space-y-4">{error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className="h-13 w-full rounded-xl border px-4"/><input type="password" required value={again} onChange={(event) => setAgain(event.target.value)} placeholder="Confirm new password" className="h-13 w-full rounded-xl border px-4"/><button disabled={confirm.isPending} className="h-13 w-full rounded-xl bg-[#c83f28] font-bold text-white disabled:opacity-60">{confirm.isPending ? "Updating…" : "Update password"}</button></form>}</section>;
}

export default function RestaurantOwnerResetPasswordPage() { return <main className="min-h-screen bg-[#fbfaf8] px-5 py-10"><div className="mx-auto flex min-h-[80vh] max-w-md items-center"><Suspense fallback={<LoaderCircle className="mx-auto animate-spin"/>}><OwnerResetForm/></Suspense></div></main>; }
