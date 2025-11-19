import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getLicenseName(skuPartNumber: string, skuNameCn?: string): string {
  return skuNameCn || skuPartNumber
}

export function formatLicenseUsage(consumed: number, enabled: number): string {
  const percentage = enabled > 0 ? Math.round((consumed / enabled) * 100) : 0
  return `${consumed}/${enabled} (${percentage}%)`
}
