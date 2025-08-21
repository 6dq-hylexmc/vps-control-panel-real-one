import { useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import { AuthPage } from "./pages/auth"
import { UserDashboard } from "./pages/user-dashboard"
import { AdminDashboard } from "./pages/admin-dashboard"

const queryClient = new QueryClient()

const App = () => {
  const { user, userProfile, loading, isAuthenticated, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated || !userProfile) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthPage />
        </TooltipProvider>
      </QueryClientProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {userProfile.role === "admin" ? (
          <AdminDashboard userName={userProfile.username} onLogout={signOut} />
        ) : (
          <UserDashboard userName={userProfile.username} onLogout={signOut} />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App;
