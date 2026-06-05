import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/AppContext"

export function MobileNavbar() {
  const { nav } = useApp()

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center border-t border-border bg-background/95 backdrop-blur px-2 pb-safe md:hidden overflow-visible">
      <div className="flex w-full items-center justify-around gap-1 px-2">
        {nav.map((item, index) => {
          // Highlight the middle item if there are 5 items (Student/Teacher "Travaux")
          const isMiddle = nav.length === 5 && index === 2

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 transition-transform active:scale-95",
                  isMiddle ? "relative -top-5 z-10" : "flex-1 py-1"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isMiddle ? (
                    <div className={cn(
                      "flex size-14 items-center justify-center rounded-full border-[6px] border-background shadow-lg transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      <item.icon className="size-6" />
                    </div>
                  ) : (
                    <item.icon className={cn("size-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  )}
                  <span className={cn(
                    "truncate text-center text-[10px] font-medium transition-colors",
                    isMiddle ? "absolute -bottom-5 max-w-[70px] font-bold" : "max-w-[64px]",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
