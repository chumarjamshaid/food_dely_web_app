"use client";

import { useRequestPasswordReset } from "@/lib/api";
import { extractAuthError } from "@/lib/api/error";
import { ArrowLeft, CheckCircle2, LoaderCircle, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [account, setAccount] = useState<"customer" | "restaurant">("customer");
  const reset = useRequestPasswordReset(account);

  const submit = (event: FormEvent) => {
    event.preventDefault(); setError("");
    reset.mutate(email, { onSuccess: () => setSent(true), onError: (e) => setError(extractAuthError(e, "We could not send the reset email. Please try again.")) });
  };

  return <main className="relative min-h-screen overflow-hidden bg-[#fbfaf8] px-5 py-10 text-[#251f1c]">
    <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 animate-pulse rounded-full bg-[#f6b8a8]/25 blur-3xl" />
    <div className="pointer-events-none absolute right-[12%] top-[18%] grid grid-cols-4 gap-5 opacity-30">{Array.from({length:16}).map((_,i)=><i key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c83f28]" style={{animationDelay:`${i*80}ms`}} />)}</div>
    <div className="relative mx-auto flex min-h-[80vh] max-w-md items-center">
      <section className="w-full rounded-[30px] border border-[#eadfd9] bg-white/90 p-7 shadow-[0_30px_90px_rgba(66,39,29,.12)] backdrop-blur-xl sm:p-9">
        <Link href="/signin" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#746862] hover:text-[#b63825]"><ArrowLeft size={17}/>Back to sign in</Link>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0eb] text-[#c83f28]">{sent?<CheckCircle2 size={27}/>:<Mail size={27}/>}</div>
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-[#b63825]"><Sparkles size={14}/>Account recovery</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.04em]">{sent?"Check your inbox":"Reset your password"}</h1>
        <p className="mt-3 text-sm leading-6 text-[#756a65]">{sent?<>If an account exists for <strong>{email}</strong>, we sent secure reset instructions.</>:"Enter the email used for your Fooddely account."}</p>
        {error&&<p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {!sent?<form onSubmit={submit} className="mt-7 space-y-5"><fieldset><legend className="text-sm font-bold">Account type</legend><div className="mt-2 grid grid-cols-2 gap-2">{(["customer","restaurant"] as const).map(type=><label key={type} className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-semibold capitalize ${account===type?"border-[#c83f28] bg-[#fff0eb] text-[#b63825]":"border-[#ded4cf]"}`}><input className="sr-only" type="radio" name="account" checked={account===type} onChange={()=>setAccount(type)}/>{type}</label>)}</div></fieldset><label className="block text-sm font-bold">Email address<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="mt-2 h-13 w-full rounded-xl border border-[#ded4cf] bg-white px-4 outline-none transition focus:border-[#c83f28] focus:ring-4 focus:ring-[#c83f28]/10"/></label><button disabled={reset.isPending} className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#c83f28] font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#ad321f] disabled:opacity-60">{reset.isPending&&<LoaderCircle size={18} className="animate-spin"/>}{reset.isPending?"Sending…":"Send reset link"}</button></form>:<button onClick={()=>setSent(false)} className="mt-7 h-13 w-full rounded-xl border border-[#ded4cf] font-bold transition hover:bg-[#faf6f3]">Use another email</button>}
      </section>
    </div>
  </main>;
}
