const DEFAULT_TIMEOUT_MS = 10000 // 10 seconds

export async function fetchApi<T>(
  url: string,
  { timeoutMs = DEFAULT_TIMEOUT_MS }: { timeoutMs?: number } = {}
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText} (${url})`)
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`)
    }
    throw error instanceof Error
      ? new Error(`Failed to fetch ${url}: ${error.message}`)
      : new Error(`Failed to fetch ${url}`)
  } finally {
    clearTimeout(timeout)
  }
}

export async function mutateApi(
  url: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
  { timeoutMs = DEFAULT_TIMEOUT_MS }: { timeoutMs?: number } = {}
): Promise<{ data?: unknown; error?: Error }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))

      return {
        data: null,
        error: new Error(
          data.error || `${response.status} ${response.statusText} (${url})`
        ),
      }
    }

    if (response.status === 204) {
      return { data: null, error: undefined }
    }

    const data = await response.json()
    return { data, error: undefined }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        data: null,
        error: new Error(`Request to ${url} timed out after ${timeoutMs}ms`),
      }
    }
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    }
  } finally {
    clearTimeout(timeout)
  }
}
