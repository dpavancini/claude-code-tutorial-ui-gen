import { test, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only to prevent import error
vi.mock("server-only", () => ({}));

// Mock cookies
const mockCookieSet = vi.fn();
const mockCookieGet = vi.fn();
const mockCookieDelete = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      set: mockCookieSet,
      get: mockCookieGet,
      delete: mockCookieDelete,
    })
  ),
}));

// Mock jose
const mockSign = vi.fn().mockResolvedValue("mock-jwt-token");
const mockJwtVerify = vi.fn();

vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation((payload) => ({
    payload,
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  })),
  jwtVerify: (...args: unknown[]) => mockJwtVerify(...args),
}));

// Import after mocks are set up
const { createSession, getSession, deleteSession } = await import("@/lib/auth");
const { SignJWT } = await import("jose");

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

test("createSession creates a JWT and sets cookie", async () => {
  await createSession("user-123", "test@example.com");

  // Verify SignJWT was called with correct payload
  expect(SignJWT).toHaveBeenCalledWith({
    userId: "user-123",
    email: "test@example.com",
    expiresAt: expect.any(Date),
  });

  // Verify cookie was set
  expect(mockCookieSet).toHaveBeenCalledOnce();
  const [cookieName, token, options] = mockCookieSet.mock.calls[0];

  expect(cookieName).toBe("auth-token");
  expect(token).toBe("mock-jwt-token");
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession sets correct expiration (7 days)", async () => {
  await createSession("user-123", "test@example.com");

  const [, , options] = mockCookieSet.mock.calls[0];

  const expectedExpiry = new Date("2025-01-22T12:00:00Z");
  expect(options.expires.getTime()).toBe(expectedExpiry.getTime());
});

test("createSession sets secure cookie in production", async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  await createSession("user-123", "test@example.com");

  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.secure).toBe(true);

  process.env.NODE_ENV = originalEnv;
});

test("createSession sets non-secure cookie in development", async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";

  await createSession("user-123", "test@example.com");

  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.secure).toBe(false);

  process.env.NODE_ENV = originalEnv;
});

test("createSession includes expiresAt in session payload", async () => {
  await createSession("user-123", "test@example.com");

  const [payload] = (SignJWT as unknown as ReturnType<typeof vi.fn>).mock.calls[0];

  expect(payload.expiresAt).toBeInstanceOf(Date);
  const expectedExpiry = new Date("2025-01-22T12:00:00Z");
  expect(payload.expiresAt.getTime()).toBe(expectedExpiry.getTime());
});

test("getSession returns session payload from valid token", async () => {
  const mockPayload = {
    userId: "user-789",
    email: "alice@example.com",
    expiresAt: new Date("2025-01-22T12:00:00Z"),
  };
  mockCookieGet.mockReturnValue({ value: "valid-token" });
  mockJwtVerify.mockResolvedValue({ payload: mockPayload });

  const session = await getSession();

  expect(session).not.toBeNull();
  expect(session?.userId).toBe("user-789");
  expect(session?.email).toBe("alice@example.com");
});

test("getSession returns null when no token exists", async () => {
  mockCookieGet.mockReturnValue(undefined);

  const session = await getSession();

  expect(session).toBeNull();
  expect(mockJwtVerify).not.toHaveBeenCalled();
});

test("getSession returns null when cookie value is undefined", async () => {
  mockCookieGet.mockReturnValue({ value: undefined });

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns null for invalid token", async () => {
  mockCookieGet.mockReturnValue({ value: "invalid-token" });
  mockJwtVerify.mockRejectedValue(new Error("Invalid token"));

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns null for expired token", async () => {
  mockCookieGet.mockReturnValue({ value: "expired-token" });
  mockJwtVerify.mockRejectedValue(new Error("Token expired"));

  const session = await getSession();

  expect(session).toBeNull();
});

test("deleteSession removes the auth cookie", async () => {
  await deleteSession();

  expect(mockCookieDelete).toHaveBeenCalledOnce();
  expect(mockCookieDelete).toHaveBeenCalledWith("auth-token");
});

test("createSession handles special characters in email", async () => {
  await createSession("user-123", "test+special@example.com");

  const [payload] = (SignJWT as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
  expect(payload.email).toBe("test+special@example.com");
});

test("createSession handles unicode in user ID", async () => {
  await createSession("user-émoji-123", "test@example.com");

  const [payload] = (SignJWT as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
  expect(payload.userId).toBe("user-émoji-123");
});

test("getSession calls jwtVerify with correct arguments", async () => {
  mockCookieGet.mockReturnValue({ value: "test-token" });
  mockJwtVerify.mockResolvedValue({
    payload: { userId: "user-123", email: "test@example.com" },
  });

  await getSession();

  expect(mockJwtVerify).toHaveBeenCalledOnce();
  const [token, secret] = mockJwtVerify.mock.calls[0];
  expect(token).toBe("test-token");
  // Check it's a Uint8Array (cross-realm safe check)
  expect(secret.constructor.name).toBe("Uint8Array");
  expect(secret.length).toBeGreaterThan(0);
});
