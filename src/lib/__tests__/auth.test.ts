// @vitest-environment node
import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { createSession, getSession } from "../auth";

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const COOKIE_NAME = "auth-token";

let store: Map<string, { value: string }>;

beforeEach(() => {
  store = new Map();
  vi.mocked(cookies).mockImplementation(
    async () =>
      ({
        get: (name: string) => store.get(name),
        set: (name: string, value: string) => {
          store.set(name, { value });
        },
        delete: (name: string) => {
          store.delete(name);
        },
      }) as any
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test("returns null when there is no session cookie", async () => {
  const session = await getSession();

  expect(session).toBeNull();
});

test("returns the session payload for a valid token", async () => {
  await createSession("user-1", "user@example.com");

  const session = await getSession();

  expect(session).toMatchObject({
    userId: "user-1",
    email: "user@example.com",
  });
  expect(session?.expiresAt).toBeDefined();
});

test("returns null when the cookie value is not a valid JWT", async () => {
  store.set(COOKIE_NAME, { value: "not-a-valid-jwt" });

  const session = await getSession();

  expect(session).toBeNull();
});

test("returns null when the token was signed with a different secret", async () => {
  const wrongKey = new TextEncoder().encode("some-other-secret");
  const badToken = await new SignJWT({
    userId: "user-1",
    email: "user@example.com",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(wrongKey);
  store.set(COOKIE_NAME, { value: badToken });

  const session = await getSession();

  expect(session).toBeNull();
});

test("returns null when the token has expired", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

  await createSession("user-1", "user@example.com");

  vi.setSystemTime(new Date("2024-01-09T00:00:00Z")); // 8 days later, past the 7d expiry

  const session = await getSession();

  expect(session).toBeNull();
});
