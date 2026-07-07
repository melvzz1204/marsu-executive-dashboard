// hooks/useDashboardState.js
import { useState, useEffect } from "react";
import api from "../api/axios";

export function useDashboardState() {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [presidentName, setPresidentName] = useState(
    "Loading Executive Profile...",
  );
  const [userRole, setUserRole] = useState("staff");
  const [userInitials, setUserInitials] = useState("..");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Helper parser engine for administrative initials computation
  const generateInitials = (fullName) => {
    if (!fullName || fullName.includes("Loading")) return "..";
    const sanitizedName = fullName.replace(
      /^(Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.)\s+/i,
      "",
    );
    const structuralTokens = sanitizedName.trim().split(/\s+/);
    if (structuralTokens.length === 1) {
      return structuralTokens[0].slice(0, 2).toUpperCase();
    }
    const firstInitial = structuralTokens[0].charAt(0);
    const lastInitial = structuralTokens[structuralTokens.length - 1].charAt(0);
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  useEffect(() => {
    const fetchExecutiveOwner = async () => {
      try {
        const response = await api.get("/auth/name");
        const targetName = response.data?.name || "Dr. Diosdado P. Zulueta";
        const targetRole = response.data?.role || "staff";

        setPresidentName(targetName);
        setUserRole(targetRole);
        setUserInitials(generateInitials(targetName));
      } catch (error) {
        console.error(
          "Dashboard core failed to pull validated session profile data:",
          error,
        );
        const fallbackName = "Dr. Diosdado P. Zulueta";
        setPresidentName(fallbackName);
        setUserRole("executive");
        setUserInitials(generateInitials(fallbackName));
      }
    };

    fetchExecutiveOwner();
  }, []);

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  };

  return {
    currentTab,
    setCurrentTab,
    isDarkMode,
    setIsDarkMode,
    presidentName,
    userRole,
    userInitials,
    isLoggingOut,
    isSidebarOpen,
    setIsSidebarOpen,
    formattedDate,
    handleLogout,
  };
}
