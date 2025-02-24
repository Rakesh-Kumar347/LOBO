import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names efficiently using `clsx` and `tailwind-merge`.
 * - `clsx`: Handles conditional class merging.
 * - `twMerge`: Resolves conflicting Tailwind classes.
 *
 * @param {...(string | boolean | null | undefined)} inputs - Class names or conditions.
 * @returns {string} A merged class string optimized for Tailwind.
 */
export function cn(...inputs) {
  try {
    return twMerge(clsx(inputs));
  } catch (error) {
    console.error("❌ Error merging class names:", error);
    return ""; // Return empty string if merging fails
  }
}
