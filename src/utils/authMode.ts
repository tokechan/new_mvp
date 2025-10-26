/**
 * Determines whether the application should enable the mock authentication mode.
 * Mock auth is allowed in automated tests (NODE_ENV === 'test') or when the
 * NEXT_PUBLIC_SKIP_AUTH flag is explicitly set while *not* running a production build.
 * In production builds, the flag is ignored to prevent accidental auth bypass.
 */
export const shouldUseMockAuth = (): boolean => {
  const nodeEnv = process.env.NODE_ENV
  const skipFlagEnabled = process.env.NEXT_PUBLIC_SKIP_AUTH === 'true'

  if (nodeEnv === 'test') {
    return true
  }

  if (nodeEnv === 'production') {
    if (skipFlagEnabled) {
      // Surface a clear warning in case the flag slipped into production.
      console.error(
        '[security] NEXT_PUBLIC_SKIP_AUTH=true detected in production build. Ignoring for safety.',
      )
    }
    return false
  }

  return skipFlagEnabled
}

/**
 * Convenience helper that also verifies the code is executing on the client.
 * This is useful for branches that rely on browser-only APIs such as localStorage.
 */
export const shouldUseClientMockAuth = (): boolean => {
  return typeof window !== 'undefined' && shouldUseMockAuth()
}
