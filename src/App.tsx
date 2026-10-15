import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { games } from "./data/games";
import Index from "./pages/Index";
import GamePage from "./pages/GamePage";
import StatisticsPage from "./pages/StatisticsPage";
import {
  AuthPage, DailyPage, GameStatsPage, GamesPage, HelpPage, HistoryPage, LeaderboardsPage, ProfilePage, SettingsPage,
} from "./pages/PlatformPages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const GameStatsRoute = () => {
  const { slug } = useParams();
  return games.some((game) => game.slug === slug) ? <GameStatsPage /> : <NotFound />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/:slug" element={<GamePage />} />
          <Route path="/games/:slug/stats" element={<GameStatsRoute />} />
          <Route path="/daily" element={<DailyPage />} />
          <Route path="/leaderboards" element={<LeaderboardsPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
