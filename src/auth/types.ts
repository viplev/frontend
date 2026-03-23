export interface AuthSession {
  token: string
  email: string
  userId?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

