import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { navItems, PRODUCT_NAME } from "./nav";
import { ThemeToggle } from "./ThemeToggle";
import { SetupWizard } from "@/components/setup/SetupWizard";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
        Ü
      </div>
      <span className="font-semibold tracking-tight">{PRODUCT_NAME}</span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-14 items-center px-4">
          <Logo />
        </div>
        <nav className="flex-1 space-y-0.5 px-2 py-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:font-medium data-[status=active]:text-sidebar-accent-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
          <span>Demo Şirket A.Ş.</span>
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur md:hidden">
          <Logo />
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 md:px-8 md:py-10 md:pb-10">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background/95 backdrop-blur md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground data-[status=active]:text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate">{item.short}</span>
          </Link>
        ))}
      </nav>

      <SetupWizard />
    </div>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="flex h-14 items-center justify-between px-4 md:px-8">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="mx-auto w-full max-w-xl px-4 py-8">{children}</main>
    </div>
  );
}
