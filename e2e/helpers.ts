import { expect, Page } from "@playwright/test";

export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

/**
 * Login sebagai Admin melalui UI.
 */
export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder(/masukkan username|username/i).fill(ADMIN_CREDENTIALS.username);
  await page.getByPlaceholder(/masukkan password|password/i).fill(ADMIN_CREDENTIALS.password);
  // Gunakan exact: true agar tidak bentrok dengan 'Login as Guest'
  await submitLogin(page, 200);
  await page.waitForURL("**/master-data");
}

/**
 * Bersihkan sesi (token & cookies).
 */
export async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
  });
}

/** Observe the real login response; network failures must never count as rejected credentials. */
export async function submitLogin(page: Page, expectedStatus: number) {
  const outcome = new Promise<import("@playwright/test").Response>((resolve, reject) => {
    const matches = (url: string) => new URL(url).pathname === "/api/auth/login";
    const cleanup = () => {
      clearTimeout(timer);
      page.off("response", onResponse);
      page.off("requestfailed", onFailed);
    };
    const onResponse = (response: import("@playwright/test").Response) => {
      if (matches(response.url()) && response.request().method() === "POST") {
        cleanup(); resolve(response);
      }
    };
    const onFailed = (request: import("@playwright/test").Request) => {
      if (matches(request.url())) {
        cleanup(); reject(new Error(`Login API network failure: ${request.failure()?.errorText}`));
      }
    };
    const timer = setTimeout(() => { cleanup(); reject(new Error("Login API did not respond within 15s")); }, 15_000);
    page.on("response", onResponse);
    page.on("requestfailed", onFailed);
  });
  const [response] = await Promise.all([
    outcome,
    page.getByRole("button", { name: "Login", exact: true }).click(),
  ]);
  expect(response.status(), "Login API must return the expected status, not a server error").toBe(expectedStatus);
  expect(response.headers()["content-type"]).toContain("application/json");
}
