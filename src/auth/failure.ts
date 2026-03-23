const AUTH_FAILURE_EVENT = 'viplev:auth-failure'

export type AuthFailureReason = 'unauthorized' | 'forbidden'

export interface AuthFailureDetail {
  reason: AuthFailureReason
  message: string
}

let hasActiveAuthFailure = false

function getMessage(reason: AuthFailureReason): string {
  if (reason === 'forbidden') {
    return 'Your session no longer has access to this resource. Please sign in again.'
  }

  return 'Your session has expired. Please sign in again.'
}

export function publishAuthFailure(reason: AuthFailureReason): void {
  if (hasActiveAuthFailure) {
    return
  }

  hasActiveAuthFailure = true
  window.dispatchEvent(
    new CustomEvent<AuthFailureDetail>(AUTH_FAILURE_EVENT, {
      detail: {
        reason,
        message: getMessage(reason),
      },
    }),
  )
}

export function subscribeToAuthFailure(
  onFailure: (detail: AuthFailureDetail) => void,
): () => void {
  const handler = (event: Event) => {
    const authEvent = event as CustomEvent<AuthFailureDetail>
    onFailure(authEvent.detail)
  }

  window.addEventListener(AUTH_FAILURE_EVENT, handler)

  return () => {
    window.removeEventListener(AUTH_FAILURE_EVENT, handler)
  }
}

export function resetAuthFailureState(): void {
  hasActiveAuthFailure = false
}

