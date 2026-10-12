const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = "turfhour_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// { city: "Pune", sport: "" } -> "?city=Pune", empty values are left out
export function toQuery(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

// every API call goes through here
export async function request(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Could not reach the server, please try again");
  }

  const data = await response.json().catch(() => ({}));

  // the token is no longer valid, so log the user out
  if (response.status === 401 && token) {
    clearToken();
    window.dispatchEvent(new Event("unauthorized"));
  }
  if (!response.ok) {
    throw new Error(data.error || "Something went wrong, please try again");
  }
  return data;
}
