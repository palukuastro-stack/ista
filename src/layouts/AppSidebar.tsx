import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/AppContext"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import locales from "@/lib/locales.json"

interface AppSidebarProps {
  mode: "desktop" | "tablet"
}

export function AppSidebar({ mode }: AppSidebarProps) {
  const { nav, portal } = useApp()
  const isRail = mode === "tablet"

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-500 ease-in-out",
        isRail ? "w-[80px]" : "w-64"
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4 transition-all duration-500", isRail ? "justify-center" : "gap-3")}>
        <img
          src="/ista.jpeg"
          alt="Logo ISTA"
          className={cn(
            "shrink-0 rounded-lg object-cover shadow-md transition-all duration-500",
            isRail ? "size-11" : "size-9"
          )}
        />
        {!isRail && (
          <div className="min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
            <p className="truncate text-sm font-black uppercase tracking-tighter text-sidebar-foreground">ISTA PORTAL</p>
            <p className="truncate text-[10px] font-bold uppercase tracking-widest text-primary">
              {portal?.role && locales.portals[portal.role as keyof typeof locales.portals]}
            </p>
          </div>
        )}
      </div>

      <nav className={cn("flex-1 space-y-2 overflow-y-auto", isRail ? "p-2" : "p-3")}>
        <TooltipProvider delayDuration={0}>
          {nav.map((item) => {
            const link = (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-xl transition-all duration-300",
                    isRail ? "h-14 w-14 justify-center" : "px-3 py-2.5 gap-3",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/20 ring-offset-2 ring-offset-sidebar"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )
                }
              >
                <item.icon className={cn("shrink-0 transition-transform duration-300", isRail ? "size-6" : "size-5")} />
                {!isRail && <span className="truncate text-xs font-bold uppercase tracking-widest">{item.label}</span>}
              </NavLink>
            )

            if (isRail) {
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>
                    {link}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-bold uppercase text-[10px] tracking-widest">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return link
          })}
        </TooltipProvider>
      </nav>

      <div className={cn("border-t border-sidebar-border p-4 transition-all duration-300", isRail && "flex justify-center")}>
        {!isRail ? (
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 animate-in fade-in duration-300">
            ISTA PORTAL · 2024
          </p>
        ) : (
          <div className="size-2 rounded-full bg-primary/40 animate-pulse" />
        )}
      </div>
    </aside>
  )
}
