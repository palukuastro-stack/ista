import { useState, useEffect } from "react"

export type NavMode = "mobile" | "tablet" | "desktop"

export function useNavigation() {
  const [mode, setMode] = useState<NavMode>("desktop")

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setMode("mobile")
      } else if (width < 1024) {
        setMode("tablet")
      } else {
        setMode("desktop")
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return mode
}
