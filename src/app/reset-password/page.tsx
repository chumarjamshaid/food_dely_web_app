"use client";

import { useConfirmPasswordReset, useValidatePasswordReset } from "@/lib/api";
import { extractAuthError } from "@/lib/api/error";
import { CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

function ResetForm({ account = "customer" }: { account?: "customer" | "restaurant" }) {
  const token = useSearchParams().get("token") ?? "";
  const validate = useValidatePasswordReset(account);
  const confirm = useConfirmPasswordReset(account);
  const [password,setPassword]=useState(""); const [again,setAgain]=useState(""); const [error,setError]=useState(""); const [done,setDone]=useState(false);
  useEffect(()=>{ if(token) validate.mutate(token); },[token]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit=(e:FormEvent)=>{e.preventDefault();setError("");if(password.length<8){setError("Use at least 8 characters.");return;}if(password!==again){setError("Passwords do not match.");return;}confirm.mutate({token,password,password_confirm:again},{onSuccess:()=>setDone(true),onError:e=>setError(extractAuthError(e,"This reset link could not be used."))});};
  const invalid=!token||validate.isError||validate.data?.valid===false;
  return <section className="w-full rounded-[30px] border border-[#eadfd9] bg-white p-8 shadow-[0_30px_90px_rgba(66,39,29,.12)]">
    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0eb] text-[#c83f28]">{done?<CheckCircle2/>:<LockKeyhole/>}</div>
    <h1 className="text-3xl font-black tracking-[-.04em]">{done?"Password updated":invalid?"Link unavailable":"Choose a new password"}</h1>
    {validate.isPending?<p className="mt-5 flex items-center gap-2 text-sm text-[#756a65]"><LoaderCircle className="animate-spin" size={17}/>Checking your secure link…</p>:done?<><p className="mt-3 text-sm text-[#756a65]">You can now sign in using your new password.</p><Link href="/signin" className="mt-7 flex h-13 items-center justify-center rounded-xl bg-[#c83f28] font-bold text-white">Continue to sign in</Link></>:invalid?<><p className="mt-3 text-sm text-[#756a65]">This reset link is invalid or expired.</p><Link href="/forgot-password" className="mt-7 flex h-13 items-center justify-center rounded-xl bg-[#c83f28] font-bold text-white">Request another link</Link></>:<form onSubmit={submit} className="mt-7 space-y-4">{error&&<p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<input type="password" autoComplete="new-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" className="h-13 w-full rounded-xl border border-[#ded4cf] px-4 outline-none focus:border-[#c83f28]"/><input type="password" autoComplete="new-password" required value={again} onChange={e=>setAgain(e.target.value)} placeholder="Confirm new password" className="h-13 w-full rounded-xl border border-[#ded4cf] px-4 outline-none focus:border-[#c83f28]"/><button disabled={confirm.isPending} className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#c83f28] font-bold text-white disabled:opacity-60">{confirm.isPending&&<LoaderCircle className="animate-spin" size={18}/>}Update password</button></form>}
  </section>;
}

export default function ResetPasswordPage(){return <main className="min-h-screen bg-[#fbfaf8] px-5 py-10 text-[#251f1c]"><div className="mx-auto flex min-h-[80vh] max-w-md items-center"><Suspense fallback={<LoaderCircle className="mx-auto animate-spin"/>}><ResetForm/></Suspense></div></main>}
