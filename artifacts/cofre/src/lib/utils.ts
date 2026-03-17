import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMT(centavos: number): string {
  if (centavos === undefined || centavos === null) return "0,00 MT";
  return (centavos / 100).toLocaleString('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(ts: number): string {
  if (!ts) return "-";
  // Convert to ms if it appears to be in seconds (Unix timestamp usually < 1e11)
  const date = new Date(ts > 1e11 ? ts : ts * 1000);
  return date.toLocaleDateString('pt-MZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateTime(ts: number): string {
  if (!ts) return "-";
  const date = new Date(ts > 1e11 ? ts : ts * 1000);
  return date.toLocaleString('pt-MZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function parseInputMoney(value: string): number {
  // Convert standard input (e.g., "100.50" or "100,50") to centavos
  const cleanStr = value.replace(',', '.');
  const parsed = parseFloat(cleanStr);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}
