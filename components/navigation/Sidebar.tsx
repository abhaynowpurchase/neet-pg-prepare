"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BookOpen,
  LayoutDashboard,
  Star,
  LogOut,
  ChevronRight,
  Stethoscope,
  Trophy,
  FileQuestion,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Subjects",
    href: "/subjects",
    icon: BookOpen,
  },
  {
    label: "High Yield",
    href: "/high-yield",
    icon: Star,
  },
  {
    label: "Progress",
    href: "/progress",
    icon: Trophy,
  },
  {
    label: "Last Year QP",
    href: "/pyq",
    icon: FileQuestion,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
          <Stethoscope className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-bold text-sm leading-none">NEET PG</p>
          <p className="text-xs text-muted-foreground mt-0.5">Story Learning</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "w-4.5 h-4.5",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  size={18}
                />
                {item.label}
                {isActive && (
                  <ChevronRight className="ml-auto w-4 h-4 text-primary" />
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User section */}
      <div className="px-3 py-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 mt-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut size={16} />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
