interface RateLimitOptions {
  windowMs: number
  maxRequests: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// createRateLimit - build a small process-local request limiter
export function createRateLimit({ windowMs, maxRequests }: RateLimitOptions) {
  const entries = new Map<string, RateLimitEntry>()

  // checkRateLimit - update and return the current rate-limit state
  return function checkRateLimit(key: string): RateLimitResult {
    const now = Date.now()
    const currentEntry = entries.get(key)

    if (!currentEntry || currentEntry.resetAt <= now) {
      const resetAt = now + windowMs
      entries.set(key, {
        count: 1,
        resetAt,
      })

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt,
      }
    }

    if (currentEntry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: currentEntry.resetAt,
      }
    }

    currentEntry.count += 1

    return {
      allowed: true,
      remaining: maxRequests - currentEntry.count,
      resetAt: currentEntry.resetAt,
    }
  }
}
