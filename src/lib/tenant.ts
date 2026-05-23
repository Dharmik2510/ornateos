let activeBusinessId: string | null = null

export function setActiveBusinessId(id: string | null) {
  activeBusinessId = id
}

export function getActiveBusinessId(): string | null {
  return activeBusinessId
}

export function requireBusinessId(): string {
  if (!activeBusinessId) {
    throw new Error('No business context. Sign in again.')
  }
  return activeBusinessId
}

export function scopedKey(base: string, businessId: string) {
  return `${base}_${businessId}`
}
