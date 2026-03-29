import { Link, useLocation } from "wouter";
import { BookOpen, GraduationCap, Settings, User, LogOut, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");
  const { student, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm shadow-primary/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            Ada21<span className="text-primary">Tech</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {student ? (
            <>
              <Link
                href="/"
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  !isAdmin && location === "/" ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Quizzes</span>
              </Link>
              <Link
                href="/profile"
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  location === "/profile" ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{student.name.split(" ")[0]}</span>
              </Link>
              <Link
                href="/admin"
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  isAdmin ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Register</span>
              </Link>
              <Link
                href="/admin"
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  isAdmin ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
