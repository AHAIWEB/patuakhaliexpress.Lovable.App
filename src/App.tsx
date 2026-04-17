import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CategoryPage from "./pages/CategoryPage.tsx";
import PostPage from "./pages/PostPage.tsx";
import Auth from "./pages/Auth.tsx";
import Admin from "./pages/Admin.tsx";
import Photocard from "./pages/Photocard.tsx";
import Gallery from "./pages/Gallery.tsx";
import GeoPage from "./pages/GeoPage.tsx";
import ThemeSwitcher from "./components/ThemeSwitcher.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/post/:slug" element={<PostPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/photocard" element={<Photocard />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/division/:slug" element={<GeoPage level="division" />} />
          <Route path="/district/:slug" element={<GeoPage level="district" />} />
          <Route path="/upazila/:slug" element={<GeoPage level="upazila" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ThemeSwitcher />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
