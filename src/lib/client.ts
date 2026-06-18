'use client';

/** Thin fetch wrapper for client components. Throws Error(message) on non-2xx. */
export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    let message = `Error ${res.status}`;
    if (data && typeof data === 'object' && 'error' in data) {
      message = String((data as { error: unknown }).error);
    }
    throw new Error(message);
  }

  return data as T;
}

export const jsonBody = (body: unknown): RequestInit => ({
  method: 'POST',
  body: JSON.stringify(body),
});
