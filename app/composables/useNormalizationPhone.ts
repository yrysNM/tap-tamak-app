export type NormalizedPhone = {
  /** Digits only, 11 digits starting with 7. Example: "77771234567" */
  digits11: string
  /** E.164-like for KZ/RU mobile format. Example: "+77771234567" */
  e164: string
  /** Local 10-digit part (without leading 7). Example: "7771234567" */
  national10: string
}

function toNational10(raw: string): string {
  const digits = (raw ?? '').replace(/\D/g, '')

  // Accept common inputs:
  // - "+7 (777) 123-45-67" -> 7771234567
  // - "8 (777) 123-45-67"  -> 7771234567
  // - "7771234567"         -> 7771234567
  // - "77771234567"        -> 7771234567
  if (digits.length >= 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return digits.slice(-10)
  }

  return digits.slice(-10)
}

export function normalizePhone(raw: string): NormalizedPhone {
  const national10 = toNational10(raw)
  const digits11 = `7${national10}`
  const e164 = `+${digits11}`

  return { digits11, e164, national10 }
}

export function useNormalizationPhone() {
  return { normalizePhone }
}

