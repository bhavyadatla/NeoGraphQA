import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import PDFStudio from "@/pages/PDFStudio";
import Documents from "@/pages/Documents";
import KnowledgeGraph from "@/pages/KnowledgeGraph";
import ImageAnalysis from "@/pages/ImageAnalysis";
import Gallery from "@/pages/Gallery";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {user ? <Redirect to="/dashboard" /> : <Landing />}
      </Route>

      <Route path="/login">
        {user ? <Redirect to="/dashboard" /> : <Login />}
      </Route>

      <Route path="/signup">
        {user ? <Redirect to="/dashboard" /> : <Signup />}
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route path="/chat">
        <ProtectedRoute component={Chat} />
      </Route>
      
      <Route path="/chat/:id">
        <ProtectedRoute component={Chat} />
      </Route>
      
      <Route path="/pdf-studio">
        <ProtectedRoute component={PDFStudio} />
      </Route>
      
      <Route path="/documents">
        <ProtectedRoute component={Documents} />
      </Route>
      
      <Route path="/kg">
        <ProtectedRoute component={KnowledgeGraph} />
      </Route>
      
      <Route path="/images">
        <ProtectedRoute component={ImageAnalysis} />
      </Route>

      <Route path="/gallery">
        <ProtectedRoute component={Gallery} />
      </Route>

      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
