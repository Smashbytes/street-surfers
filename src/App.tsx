import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Eagerly loaded — needed before auth resolves
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";

// Lazy-loaded pages
const Index       = lazy(() => import("./pages/Index"));
const MyTrips     = lazy(() => import("./pages/MyTrips"));
const TripDetails = lazy(() => import("./pages/TripDetails"));
const Profile     = lazy(() => import("./pages/Profile"));
const LiveMap     = lazy(() => import("./pages/LiveMap"));
const Onboarding  = lazy(() => import("./pages/Onboarding"));
const Schedule    = lazy(() => import("./pages/Schedule"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <PWAInstallPrompt />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/onboarding" element={
                <ProtectedRoute requireOnboarding={false}>
                  <Suspense fallback={<PageLoader />}><Onboarding /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}><Index /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/trips" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}><MyTrips /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/passenger/trips/:trip_id" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}><TripDetails /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/map" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}><LiveMap /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/schedule" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}><Schedule /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}><Profile /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
