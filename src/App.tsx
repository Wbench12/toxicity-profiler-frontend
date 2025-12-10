import React, { useState } from "react";
import {
  Link,
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
} from "react-router-dom";
import { Home } from "@/pages/Home";
import { Builder } from "@/pages/Builder";
import { Analysis } from "@/pages/Analysis";
import { Similarity } from "@/pages/Similarity";
import { Visuals } from "@/pages/Visuals";
import { Menu, X, Beaker } from "lucide-react";

/**
 * Navigation Bar Component
 */
const Navbar: React.FC<{ isOpen: boolean; onToggle: () => void }> = ({
  isOpen,
  onToggle,
}) => {
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/builder", label: "Build" },
    { path: "/analysis", label: "Analysis" },
    { path: "/similarity", label: "Similarity" },
    { path: "/visuals", label: "Visuals" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl hover:opacity-80"
          >
            <Beaker className="w-6 h-6" />
            <span>QSAR</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  isActive(link.path)
                    ? "bg-blue-900 text-white"
                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={onToggle}
            className="md:hidden p-2 hover:bg-blue-700 rounded-lg transition"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={onToggle}
                className={`block px-4 py-2 rounded-lg font-semibold transition ${
                  isActive(link.path)
                    ? "bg-blue-900 text-white"
                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

/**
 * Main App Component
 * Wraps all pages with React Router and navigation
 */
const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar
        isOpen={mobileMenuOpen}
        onToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<AppLayout />}>
      <Route index element={<Home />} />
      <Route path="builder" element={<Builder />} />
      <Route path="analysis" element={<Analysis />} />
      <Route path="similarity" element={<Similarity />} />
      <Route path="visuals" element={<Visuals />} />
    </Route>
  )
);

/**
 * App Component
 * Root entry point with React Router provider
 */
export const App: React.FC = () => {
  return (
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  );
};

export default App;
