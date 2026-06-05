// src/lib/constants.ts
// Shared UI constants — single source of truth for every component that needs them.
import { FileText, Video, Link2, File, type LucideIcon } from "lucide-react"
import type { CourseResource } from "@/types"

/** Ordered weekdays used to sort schedules (Mon–Sat, index 0 = Lundi) */
export const WEEK_DAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
] as const

export type WeekDay = (typeof WEEK_DAYS)[number]

/**
 * Full week starting on Sunday at index 0.
 * Matches `Date.prototype.getDay()` so you can do `WEEK_DAYS_FULL[new Date().getDay()]`.
 */
export const WEEK_DAYS_FULL = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
] as const

/** Lucide icon component per resource type */
export const RESOURCE_ICONS: Record<CourseResource["type"], LucideIcon> = {
  pdf: FileText,
  video: Video,
  link: Link2,
  doc: File,
}

/** Human-readable label per resource type */
export const RESOURCE_LABELS: Record<CourseResource["type"], string> = {
  pdf: "PDF",
  video: "Vidéo",
  link: "Lien web",
  doc: "Document",
}

/** Tailwind colour classes per resource type */
export const RESOURCE_COLORS: Record<CourseResource["type"], string> = {
  pdf: "bg-destructive/10 text-destructive",
  video: "bg-chart-2/10 text-chart-2",
  link: "bg-chart-5/10 text-chart-5",
  doc: "bg-chart-3/10 text-chart-3",
}
