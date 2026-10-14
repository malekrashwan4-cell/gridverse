import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return <AppShell><div className="mx-auto flex min-h-[calc(100vh-68px)] max-w-xl items-center justify-center px-6 py-16 text-center"><div><span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-primary/10 text-primary"><Compass className="h-7 w-7" /></span><p className="mt-6 text-[10px] font-bold uppercase tracking-[.2em] text-primary">Wrong turn</p><h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-.06em]">This page isn't on the grid.</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">The route may have moved, or the puzzle never existed. Let's get you back to something playable.</p><Button type="button" asChild className="mt-7 rounded-xl font-bold"><Link to="/">Return home</Link></Button></div></div></AppShell>;
}
