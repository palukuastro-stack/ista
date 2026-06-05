// src/lib/portals.ts
import {
  GraduationCap,
  BookOpen,
  DoorOpen,
  ClipboardList,
  Building2,
  Landmark,
  ShieldCheck,
  LayoutDashboard,
  Home,
  Users,
  CalendarDays,
  FileText,
  UserPlus,
  ClipboardCheck,
  FolderOpen,
  UserSquare2,
  BarChart3,
  AlertCircle,
  BookMarked,
  type LucideIcon,
} from "lucide-react"
import type { Role, PortalInfo } from "@/types"

export const PORTALS: (PortalInfo & { icon: LucideIcon; color: string })[] = [
  {
    role: "student",
    label: "Étudiant",
    description: "Cours, notes et horaire.",
    icon: GraduationCap,
    color: "text-chart-1",
  },
  {
    role: "teacher",
    label: "Enseignant",
    description: "Gestion des cours et notes.",
    icon: BookOpen,
    color: "text-chart-2",
  },
  {
    role: "apparitorat",
    label: "Apparitorat",
    description: "Inscriptions et étudiants.",
    icon: ClipboardList,
    color: "text-chart-3",
  },
  {
    role: "secretariat_faculte",
    label: "Secrétariat Faculté",
    description: "Gestion académique.",
    icon: Building2,
    color: "text-chart-4",
  },
  {
    role: "secretariat_general",
    label: "Secrétariat Général",
    description: "Coordination et résultats.",
    icon: Landmark,
    color: "text-chart-5",
  },
  {
    role: "rectorat",
    label: "Rectorat",
    description: "Pilotage et statistiques.",
    icon: ShieldCheck,
    color: "text-primary",
  },
]

export function getPortal(role: Role) {
  return PORTALS.find((p) => p.role === role)
}

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  student: [
    { label: "Accueil",      to: "/student/dashboard",    icon: Home },
    { label: "Horaire",      to: "/student/schedule",     icon: CalendarDays },
    { label: "Travaux",      to: "/student/assignments",  icon: ClipboardCheck },
    { label: "Notes",        to: "/student/grades",       icon: FileText },
    { label: "Ressources",   to: "/student/resources",    icon: FolderOpen },
  ],
  teacher: [
    { label: "Accueil",      to: "/teacher/dashboard",   icon: Home },
    { label: "Cours",        to: "/teacher/courses",     icon: BookOpen },
    { label: "Travaux",      to: "/teacher/assignments", icon: ClipboardCheck },
    { label: "Notes",        to: "/teacher/grades",      icon: FileText },
    { label: "Horaire",      to: "/teacher/schedule",    icon: CalendarDays },
  ],
  apparitorat: [
    { label: "Accueil",      to: "/apparitorat/dashboard",    icon: Home },
    { label: "Inscriptions", to: "/apparitorat/inscriptions", icon: UserPlus },
    { label: "Étudiants",    to: "/apparitorat/students",     icon: Users },
    { label: "Locaux",       to: "/apparitorat/rooms",        icon: DoorOpen },
  ],
  secretariat_faculte: [
    { label: "Accueil",      to: "/secretariat_faculte/dashboard",  icon: Home },
    { label: "Promotions",   to: "/secretariat_faculte/promotions", icon: Users },
    { label: "Cours",        to: "/secretariat_faculte/courses",    icon: BookOpen },
    { label: "Recours",      to: "/secretariat_faculte/recours",    icon: AlertCircle },
  ],
  secretariat_general: [
    { label: "Accueil",      to: "/secretariat_general/dashboard", icon: Home },
    { label: "Entités",      to: "/secretariat_general/entities",  icon: Building2 },
    { label: "Étudiants",    to: "/secretariat_general/students",  icon: Users },
    { label: "Enseignants",  to: "/secretariat_general/teachers",  icon: UserSquare2 },
    { label: "Académique",   to: "/secretariat_general/academic",  icon: BarChart3 },
  ],
  rectorat: [
    { label: "Accueil",      to: "/rectorat/dashboard", icon: Home },
    { label: "Stats",        to: "/rectorat/stats",     icon: BarChart3 },
    { label: "Facultés",     to: "/rectorat/faculties", icon: Building2 },
    { label: "Académique",   to: "/rectorat/academic",  icon: BookMarked },
  ],
}
