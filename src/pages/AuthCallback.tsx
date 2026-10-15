import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError || !data.session) {
        setError(sessionError?.message ?? "The sign-in session could not be verified. Please try again.");
        return;
      }
      navigate("/", { replace: true });
    });
    return () => { active = false; };
  }, [navigate]);

  return <main className="grid min-h-screen place-items-center bg-background px-5"><section className="w-full max-w-md rounded-[26px] border border-border/70 bg-card p-8 text-center shadow-sm">{error ? <><h1 className="font-display text-xl font-extrabold">Sign-in could not be completed</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{error}</p><Button asChild className="mt-6 rounded-xl font-bold"><Link to="/auth">Try again</Link></Button></> : <><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /><h1 className="mt-5 font-display text-xl font-extrabold">Verifying your account</h1><p className="mt-2 text-sm text-muted-foreground">Please wait while Gridverse restores your session.</p></>}</section></main>;
}
