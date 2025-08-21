import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value: Date | string | number | undefined | null): string {
  if (!value) return ""
  try {
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return ""
    return d.toLocaleDateString()
  } catch {
    return ""
  }
}

export function toIsoString(value: Date | string | number | undefined | null): string {
  try {
    const d = value instanceof Date ? value : new Date(value as any)
    if (Number.isNaN(d.getTime())) return new Date().toISOString()
    return d.toISOString()
  } catch {
    return new Date().toISOString()
  }
}
