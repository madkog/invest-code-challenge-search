type Rgb = [number, number, number]

function parseHex(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  const digits = match?.[1]
  if (!digits) return null

  const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join('') : digits
  const value = parseInt(full, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

// Relative luminance, as WCAG defines it.
function luminance([red, green, blue]: Rgb): number {
  const [r, g, b] = [red, green, blue].map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }) as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(first: number, second: number): number {
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

/**
 * The WCAG contrast ratio between two hex colours, from 1 to 21. Null if either is not hex.
 */
export function contrastRatio(first: string, second: string): number | null {
  const firstRgb = parseHex(first)
  const secondRgb = parseHex(second)
  if (!firstRgb || !secondRgb) return null
  return contrast(luminance(firstRgb), luminance(secondRgb))
}
