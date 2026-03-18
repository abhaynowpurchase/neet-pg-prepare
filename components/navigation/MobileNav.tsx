"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import {
  BookOpen,
  LayoutDashboard,
  Star,
  LogOut,
  X,
  Stethoscope,
  Trophy,
  FileQuestion,
  Flame,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const ADMIN_EMAIL = "abhay@nowpurchase.com";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "High Yield", href: "/high-yield", icon: Star },
  { label: "Progress", href: "/progress", icon: Trophy },
  { label: "Last Year QP", href: "/pyq", icon: FileQuestion },
  { label: "Expected Questions", href: "/expected-questions", icon: Flame },
];

const adminNavItems = [
  { label: "Crawler", href: "/crawler", icon: Bot },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed left-0 top-0 bottom-0 w-72 bg-card border-r shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Stethoscope className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm">NEET PG Stories</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {[...navItems, ...(isAdmin ? adminNavItems : [])].map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <span
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-6 border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut size={16} />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
