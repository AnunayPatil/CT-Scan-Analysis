import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Upload,
  FileSearch,
  History,
  FileText,
  Brain,
  Network,
  Shield,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Activity,
  User,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  roles?: ("doctor" | "radiologist" | "admin" | "patient")[];
}

const doctorNavItems: NavItem[] = [
  { title: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard, roles: ["doctor", "radiologist", "admin"] },
  { title: "Upload Scan", href: "/doctor/upload", icon: Upload, roles: ["doctor", "radiologist", "admin"] },
  { title: "Results", href: "/doctor/results", icon: FileSearch, roles: ["doctor", "radiologist", "admin"] },
  { title: "Scan History", href: "/doctor/history", icon: History, roles: ["doctor", "radiologist", "admin"] },
  { title: "Reports", href: "/doctor/reports", icon: FileText, roles: ["doctor", "radiologist", "admin"] },
];

const doctorSecondaryNavItems: NavItem[] = [
  { title: "Compliance", href: "/doctor/compliance", icon: Shield, roles: ["doctor", "radiologist", "admin"] },
];

const patientNavItems: NavItem[] = [
  { title: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard, roles: ["patient"] },
  { title: "Upload Scan", href: "/patient/upload", icon: Upload, roles: ["patient"] },
  { title: "My Scans", href: "/patient/scans", icon: History, roles: ["patient"] },
  { title: "My Reports", href: "/patient/reports", icon: FileText, roles: ["patient"] },
  { title: "Profile", href: "/patient/profile", icon: User, roles: ["patient"] },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + "/");

  // Get navigation items based on user role
  const getNavItems = () => {
    if (!user) return { main: [], secondary: [] };

    if (user.role === "patient") {
      return {
        main: patientNavItems.filter(item => !item.roles || item.roles.includes(user.role)),
        secondary: [],
      };
    }

    return {
      main: doctorNavItems.filter(item => !item.roles || item.roles.includes(user.role)),
      secondary: doctorSecondaryNavItems.filter(item => !item.roles || item.roles.includes(user.role)),
    };
  };

  const { main: mainNavItems, secondary: secondaryNavItems } = getNavItems();

  const getDashboardPath = () => {
    if (!user) return "/doctor/dashboard";
    if (user.role === "patient") return "/patient/dashboard";
    return "/doctor/dashboard";
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);

    const linkContent = (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-sidebar-accent",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
            : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{item.title}</span>}
        {!collapsed && item.badge && (
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link to={getDashboardPath()} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">NeuroScan</span>
              <span className="text-[10px] text-muted-foreground">AI Stroke Detection</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border bg-background shadow-sm"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {secondaryNavItems.length > 0 && (
          <>
            <Separator className="my-4" />
            <nav className="flex flex-col gap-1">
              {secondaryNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </nav>
          </>
        )}
      </ScrollArea>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex flex-col gap-2">
          {/* Theme Toggle */}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "sm"}
                className={cn("w-full justify-start", collapsed && "justify-center")}
                onClick={toggleTheme}
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                {!collapsed && (
                  <span className="ml-2">
                    {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">Toggle theme</TooltipContent>
            )}
          </Tooltip>

          {/* User Info */}
          {user && !collapsed && (
            <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-2">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`}
                alt={user.firstName}
                className="h-8 w-8 rounded-full"
              />
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-sidebar-foreground">
                  {user.firstName} {user.lastName}
                </span>
                <span className="truncate text-xs text-muted-foreground capitalize">
                  {user.role}
                </span>
              </div>
            </div>
          )}

          {/* Logout */}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "sm"}
                className={cn(
                  "w-full justify-start text-muted-foreground hover:text-destructive",
                  collapsed && "justify-center"
                )}
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span className="ml-2">Logout</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">Logout</TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
