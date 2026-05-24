export type RegistrationRole = 'USER' | 'COOK'

export function getOfferAgreementUrl(role: RegistrationRole): string {
  return role === 'COOK' ? '/legal/offer-cook.docx' : '/legal/offer-client.docx'
}

export function parseRegistrationRole(value: unknown): RegistrationRole {
  const r = String(value ?? '').toLowerCase()
  return r === 'cook' ? 'COOK' : 'USER'
}

export function navigateToOfferAgreement(role: RegistrationRole) {
  const queryRole = role === 'COOK' ? 'cook' : 'user'
  return navigateTo({ path: '/legal/offer', query: { role: queryRole } })
}

export function openOfferAgreement(role: RegistrationRole) {
  if (!import.meta.client) return
  const url = getOfferAgreementUrl(role)
  window.open(url, '_blank', 'noopener,noreferrer')
}
