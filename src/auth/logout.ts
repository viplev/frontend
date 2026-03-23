import { resetAuthFailureState } from './failure'
import { clearAuthSession } from './storage'

type LogoutResetHandler = () => void

const logoutResetHandlers = new Set<LogoutResetHandler>()

export function subscribeToLogoutResets(
  handler: LogoutResetHandler,
): () => void {
  logoutResetHandlers.add(handler)

  return () => {
    logoutResetHandlers.delete(handler)
  }
}

export function performLogoutTeardown(): void {
  clearAuthSession()
  resetAuthFailureState()

  for (const handler of logoutResetHandlers) {
    handler()
  }
}

