const API_URL = "http://localhost:4000";

export async function apiFetch(
  path: string,
  token: string | null,
  options: RequestInit = {}
) {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...options.headers,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Something went wrong"
    );
  }

  return data;
}