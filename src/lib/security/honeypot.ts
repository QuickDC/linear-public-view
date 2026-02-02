/**
 * Validates the honeypot field
 * The honeypot field should be empty (undefined or empty string)
 * If it's filled, it's likely a bot
 */
export function validateHoneypot(honeypotValue: any): boolean {
  // Honeypot should be empty or undefined
  return !honeypotValue || honeypotValue === '';
}
