import { createContext, useContext, useState, ReactNode } from "react";

interface AdminContextType {
  isAdmin: boolean;
  login: (id: string, pass: string) => boolean;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  // Check sessionStorage for persistence across soft reloads, but not forever
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem("admin_unlocked") === "true");

  const login = (id: string, pass: string) => {
    if (id === "ID1122" && pass === "senhajose") {
      setIsAdmin(true);
      sessionStorage.setItem("admin_unlocked", "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem("admin_unlocked");
  };

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used within an AdminProvider");
  return context;
}
