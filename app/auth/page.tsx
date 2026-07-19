"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function signIn(event: FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) return setMessage("Add your Supabase URL and public key to enable sign-in.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : "Signed in successfully. Return to GlobalBeat.");
  }

  async function signUp() {
    const supabase = createClient();
    if (!supabase) return setMessage("Add your Supabase URL and public key to enable registration.");
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? error.message : "Account created. Check your email if confirmation is enabled.");
  }

  return <main className="auth-page"><div className="auth-card glass"><Link className="back-link" href="/">← Back to GlobalBeat</Link><h1>Welcome back.</h1><p>Listeners, artists and administrators use one secure account system with role-based access.</p><form onSubmit={signIn}><label>Email<input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} /></label><label>Password<input type="password" minLength={6} required value={password} onChange={(e)=>setPassword(e.target.value)} /></label><button className="primary-button full">Sign in</button></form><button className="secondary-button full" onClick={signUp}>Create account</button>{message && <p>{message}</p>}</div></main>;
}
