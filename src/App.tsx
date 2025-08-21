import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Login } from "./pages/login";
import { UserDashboard } from "./pages/user-dashboard";
import { AdminDashboard } from "./pages/admin-dashboard";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<{ username: string; role: "admin" | "user" } | null>(null);

  const handleLogin = (username: string, role: "admin" | "user") => {
    setUser({ username, role });
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Login onLogin={handleLogin} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {user.role === "admin" ? (
          <AdminDashboard userName={user.username} onLogout={handleLogout} />
        ) : (
          <UserDashboard userName={user.username} onLogout={handleLogout} />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
