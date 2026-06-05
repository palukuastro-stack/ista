import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a user object by splitting a "name" property into firstName, lastName, and middleName.
 */
export function normalizeUser<T extends { name?: string; firstName?: string; lastName?: string; middleName?: string }>(u: T): T & { firstName: string; lastName: string; middleName: string } {
  if (u.name && !u.firstName) {
    const parts = u.name.trim().split(/\s+/)
    return {
      ...u,
      firstName: parts[0] || "",
      lastName: parts.length > 1 ? parts[parts.length - 1] : "",
      middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : ""
    } as any
  }
  return {
    ...u,
    firstName: u.firstName || "",
    lastName: u.lastName || "",
    middleName: u.middleName || ""
  } as any
}

/**
 * Generates initials from first and last names.
 */
export function getInitials(firstName?: string, lastName?: string) {
  return ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase()
}
