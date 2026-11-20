const HEX_PATTERN = /^#?([0-9a-f]{6})$/i

const INK = '#241a14'
const PAPER = '#fffdf8'

/** Normalize a 6-digit hex value, with or without the leading `#`. */
export function normalizeHex(value: string): string | null {
  const match = value.trim().match(HEX_PATTERN)
  return match ? `#${match[1].toLowerCase()}` : null
}

function channelLuminance(channel: number): number {
  const srgb = channel / 255
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number | null {
  const normalized = normalizeHex(hex)
  if (!normalized) return null

  const red = channelLuminance(parseInt(normalized.slice(1, 3), 16))
  const green = channelLuminance(parseInt(normalized.slice(3, 5), 16))
  const blue = channelLuminance(parseInt(normalized.slice(5, 7), 16))

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

/**
 * Pick ink or paper text for a background color, whichever has more contrast.
 * Keeps primary buttons readable when the owner changes brand colors.
 */
export function readableForeground(background: string): string {
  const luminance = relativeLuminance(background)
  if (luminance === null) return PAPER

  const paperLuminance = relativeLuminance(PAPER) ?? 0.99
  const inkLuminance = relativeLuminance(INK) ?? 0.012
  const contrastWithPaper = (paperLuminance + 0.05) / (luminance + 0.05)
  const contrastWithInk = (luminance + 0.05) / (inkLuminance + 0.05)

  return contrastWithInk >= contrastWithPaper ? INK : PAPER
}

export { INK, PAPER }
