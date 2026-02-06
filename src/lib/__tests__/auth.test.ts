// @vitest-environment node
import { webcrypto } from "node:crypto";
import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

vi.stubGlobal("crypto", webcrypto);
vi.mock("server-only", () => ({}));

const mockSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ set: mockSet })),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  mockSet.mockClear();
});

test("createSession sets an httpOnly cookie named 'auth-token'", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "test@example.com");

  expect(mockSet).toHaveBeenCalledOnce();
  const [name, , options] = mockSet.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession produces a valid JWT with userId and email", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "test@example.com");

  const token = mockSet.mock.calls[0][1] as string;
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-1");
  expect(payload.email).toBe("test@example.com");
});

test("createSession sets cookie expiry to 7 days from now", async () => {
  const { createSession } = await import("@/lib/auth");
  const before = Date.now();
  await createSession("user-1", "test@example.com");
  const after = Date.now();

  const options = mockSet.mock.calls[0][2];
  const expires = new Date(options.expires).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  expect(expires).toBeGreaterThanOrEqual(before + sevenDays);
  expect(expires).toBeLessThanOrEqual(after + sevenDays);
});

test("createSession sets secure flag based on NODE_ENV", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "test@example.com");

  const options = mockSet.mock.calls[0][2];
  // In test environment NODE_ENV is "test", not "production"
  expect(options.secure).toBe(false);
});
