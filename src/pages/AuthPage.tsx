import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Chrome, Loader2, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/", { replace: true });
    });
  }, [navigate]);

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    setMessage("");
    const redirectTo = new URL("/auth/callback", window.location.origin).href;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) {
      setMessage(error.message);
      setGoogleLoading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const normalizedUsername = username.trim();
    if (mode === "signup" && (normalizedUsername.length < 3 || normalizedUsername.length > 24)) {
      setLoading(false);
      setMessage("Username must be between 3 and 24 characters.");
      return;
    }
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password, options: { data: { username: normalizedUsername }, emailRedirectTo: new URL("/auth/callback", window.location.origin).href } });
    setLoading(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setMessage("Check your email to confirm your account.");
      return;
    }
    navigate("/", { replace: true });
  };

  return <div className="grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
    <section className="hidden bg-[#24284a] p-10 text-white lg:flex lg:flex-col lg:justify-between">
      <Link to="/" className="font-display text-[17px] font-extrabold tracking-[-.04em]">GRIDVERSE</Link>
      <div><div className="grid w-[250px] grid-cols-5 gap-2" aria-hidden="true">{Array.from({ length: 25 }).map((_, index) => <span key={index} className={cn("aspect-square rounded-md border border-white/10", [1, 7, 8, 13, 18, 23].includes(index) ? "bg-[#8278ff]" : "bg-white/[.035]")} />)}</div><h1 className="mt-10 max-w-[370px] font-display text-4xl font-extrabold leading-[1.03] tracking-[-.06em]">A better way to spend five quiet minutes.</h1><p className="mt-5 max-w-[330px] text-sm leading-6 text-white/60">Play thoughtful puzzles, build a streak, and keep every solve with you.</p></div>
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/40">28 puzzles · one curious community</p>
    </section>
    <section className="flex items-center justify-center bg-background px-5 py-12"><div className="w-full max-w-[400px]">
      <Link to="/" className="mb-12 flex justify-center font-display text-[17px] font-extrabold lg:hidden">GRIDVERSE</Link>
      <div className="mb-8"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Welcome to the grid</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-.05em]">{mode === "login" ? "Good to see you." : "Join the puzzle."}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Sign in to sync your progress across devices, or keep playing as a guest.</p></div>
      <Button type="button" onClick={signInWithGoogle} disabled={googleLoading || loading} variant="outline" className="h-11 w-full rounded-xl font-bold">{googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="mr-2 h-4 w-4" />} Continue with Google</Button>
      <div className="my-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground"><span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" /></div>
      <form onSubmit={submit} className="space-y-4">{mode === "signup" && <div><label htmlFor="username" className="mb-2 block text-[11px] font-bold">Username</label><Input id="username" value={username} onChange={(event) => setUsername(event.target.value)} required placeholder="e.g. MosaicMind" className="h-11 rounded-xl" /></div>}<div><label htmlFor="email" className="mb-2 block text-[11px] font-bold">Email address</label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" className="h-11 rounded-xl" /></div><div><label htmlFor="password" className="mb-2 block text-[11px] font-bold">Password</label><Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder="At least 6 characters" className="h-11 rounded-xl" /></div>{message && <p role="alert" className={cn("rounded-xl px-3 py-2 text-xs font-semibold", message.includes("must") || message.toLowerCase().includes("invalid") || message.toLowerCase().includes("error") ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600")}>{message}</p>}<Button disabled={loading || googleLoading} type="submit" className="h-11 w-full rounded-xl font-bold">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : mode === "login" ? <LogIn className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}{loading ? "Working…" : mode === "login" ? "Sign in" : "Create account"}</Button></form>
      <Button type="button" variant="ghost" onClick={() => navigate("/")} className="mt-3 h-10 w-full rounded-xl text-xs font-bold text-muted-foreground">Continue as guest</Button>
      <p className="mt-7 text-center text-xs font-semibold text-muted-foreground">{mode === "login" ? "New to Gridverse?" : "Already have an account?"} <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }} className="font-bold text-primary hover:underline">{mode === "login" ? "Create one" : "Sign in"}</button></p>
    </div></section>
  </div>;
}
