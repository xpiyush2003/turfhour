import { request } from "./client.js";

export function register(body) {
  return request("/auth/register", { method: "POST", body });
}

export function login(email, password) {
  return request("/auth/login", { method: "POST", body: { email, password } });
}

export function demoLogin(role) {
  return request("/auth/demo", { method: "POST", body: { role } });
}

export function getMe() {
  return request("/auth/me");
}
