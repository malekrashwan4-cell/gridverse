import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  BarChart3, BookOpen, ChevronDown, Flame, Grid2X2, HelpCircle, Home, LogIn, Menu,
  Moon, MoreHorizontal, Settings, Sparkles, Sun, Trophy, UserRound, X,
} from "lucide-react";

const navigation = [
  { label: "Home", to: "/", icon: Home },
  { label: "All games", to: "/games", icon: Grid2X2 },
  { label: "Daily challenges", to: "/daily", icon: Flame },
  { label: "Leaderboards", to: "/leaderboards", icon: Trophy },
  { label: "Statistics", to: "/statistics", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("gridverse-theme") ?? "light");
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("gridverse-theme", theme);
  }, [theme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const initials = useMemo(() => (user?.user_metadata?.username ?? user?.email ?? "GU").slice(0, 2).toUpperCase(), [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navItems = (mobile = false) => (
    <div className={cn("flex", mobile ? "flex-col gap-1" : "flex-col gap-1.5")}>
      {navigation.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className={({ isActive }) => cn(
            "group flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-semibold transition-all",
            isActive ? "bg-[hsl(var(--primary)/.1)] text-primary shadow-sm" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          )}
        >
          {({ isActive }) => <><Icon className={cn("h-[17px] w-[17px]", isActive ? "text-primary" : "text-muted-foreground/80")} strokeWidth={isActive ? 2.5 : 2} /><span>{label}</span>{label === "Daily challenges" && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#F07A5E]" />}</>}
        </NavLink>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[246px] flex-col border-r border-border/70 bg-card/70 px-5 py-6 backdrop-blur-xl lg:flex">
        <Link to="/" className="mb-10 flex items-center gap-2.5 px-2">
          <span className="grid h-9 w-9 grid-cols-2 gap-1 rounded-xl bg-primary p-2 shadow-[0_8px_20px_hsl(var(--primary)/.22)]">
            <span className="rounded-[3px] bg-white/95" /><span className="rounded-[3px] bg-white/65" /><span className="rounded-[3px] bg-white/65" /><span className="rounded-[3px] bg-white/95" />
          </span>
          <span className="font-display text-[17px] font-extrabold tracking-[-.04em]">GRIDVERSE</span>
        </Link>
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground/70">Explore</p>
        {navItems()}
        <div className="mt-auto space-y-1.5">
          <div className="mb-5 rounded-2xl border border-primary/15 bg-primary/[.055] p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Daily streak</div>
            <div className="flex items-end justify-between"><span className="font-display text-3xl font-extrabold">7</span><span className="pb-1 text-[11px] font-semibold text-muted-foreground">days in a row</span></div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/10"><div className="h-full w-[70%] rounded-full bg-primary" /></div>
          </div>
          <NavLink to="/profile" className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-semibold text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"><UserRound className="h-[17px] w-[17px]" /> Profile</NavLink>
          <NavLink to="/settings" className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-semibold text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"><Settings className="h-[17px] w-[17px]" /> Settings</NavLink>
          <NavLink to="/help" className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-semibold text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"><HelpCircle className="h-[17px] w-[17px]" /> Help & about</NavLink>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:ml-[246px] lg:px-10">
        <div className="flex items-center gap-3 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-card px-5 pt-7"><div className="mb-9 flex items-center gap-2.5"><span className="grid h-9 w-9 grid-cols-2 gap-1 rounded-xl bg-primary p-2"><span className="rounded-[3px] bg-white" /><span className="rounded-[3px] bg-white/65" /><span className="rounded-[3px] bg-white/65" /><span className="rounded-[3px] bg-white" /></span><span className="font-display text-[17px] font-extrabold">GRIDVERSE</span></div>{navItems(true)}</SheetContent>
          </Sheet>
          <Link to="/" className="font-display text-[16px] font-extrabold tracking-[-.04em]">GRIDVERSE</Link>
        </div>
        <div className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground lg:flex"><BookOpen className="h-4 w-4" /> Make time for a better kind of break.</div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-xl text-muted-foreground hover:text-foreground">{theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</Button>
          {user ? <button onClick={() => navigate("/profile")} className="flex items-center gap-2 rounded-full border border-border/70 bg-card py-1 pl-1 pr-2 transition hover:border-primary/30"><Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">{initials}</AvatarFallback></Avatar><span className="hidden text-xs font-bold sm:inline">{user.user_metadata?.username ?? "Player"}</span><ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" /></button> : <Button onClick={() => navigate("/auth")} size="sm" className="h-9 rounded-xl px-3.5 font-bold"><LogIn className="mr-1.5 h-3.5 w-3.5" /> Sign in</Button>}
          <Button variant="ghost" size="icon" aria-label="More options" className="rounded-xl text-muted-foreground"><MoreHorizontal className="h-[18px] w-[18px]" /></Button>
        </div>
      </header>

      <main className="lg:ml-[246px]">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-5 border-t border-border/70 bg-card/90 px-2 py-2 backdrop-blur-xl lg:hidden">
        {navigation.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => cn("flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-bold", isActive ? "text-primary" : "text-muted-foreground")}><Icon className="h-4 w-4" /><span>{label === "Daily challenges" ? "Daily" : label.split(" ")[0]}</span></NavLink>)}
      </nav>
    </div>
  );
}
