import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { StudentProfile } from "@workspace/api-zod/src/generated/types";

interface AuthContextType {
  student: StudentProfile | null;
  isLoading: boolean;
  login: (studentData: StudentProfile) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error("Not logged in");
      })
      .then((data) => {
        setStudent(data);
      })
      .catch(() => {
        setStudent(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = (studentData: StudentProfile) => {
    setStudent(studentData);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setStudent(null);
    }
  };

  return (
    <AuthContext.Provider value={{ student, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
