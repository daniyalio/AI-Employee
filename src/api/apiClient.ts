const API_URL = import.meta.env.VITE_API_URL;

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
    authToken = token;
}

export async function apiRequest<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const headers = new Headers(options?.headers);

    headers.set("Content-Type", "application/json");

    if (authToken) {
        headers.set("Authorization", `Bearer ${authToken}`);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json() as {
            message?: string;
        };

        throw new Error(
            errorData.message ?? `Request failed: ${response.status}`
        );
    }

    return await response.json() as T;
}