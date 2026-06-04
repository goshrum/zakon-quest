import { test, expect, type ConsoleMessage } from "@playwright/test";

// Collect console errors for every test and assert none leaked.
let consoleErrors: string[] = [];

test.beforeEach(({ page }) => {
  consoleErrors = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
});

test.afterEach(() => {
  expect(consoleErrors, "no console errors").toEqual([]);
});

test("start screen shows the core actions", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("start-quiz")).toBeVisible();
  await expect(page.getByTestId("open-study")).toBeVisible();
});

test("study mode lists and filters questions", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("open-study").click();
  await expect(page.getByTestId("study-list")).toBeVisible();

  const total = await page.getByTestId("study-item").count();
  expect(total).toBeGreaterThan(0);

  await page.getByTestId("study-search").fill("Criminal Code");
  await expect.poll(async () => page.getByTestId("study-item").count()).toBeLessThanOrEqual(total);
  expect(await page.getByTestId("study-item").count()).toBeGreaterThan(0);

  await page.getByTestId("study-search").fill("zzz-no-such-match-xyz");
  await expect.poll(async () => page.getByTestId("study-item").count()).toBe(0);

  await page.getByTestId("study-back").click();
  await expect(page.getByTestId("start-quiz")).toBeVisible();
});

test("a quiz round can be started and answered", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("start-quiz").click();
  const firstAnswer = page.getByTestId("answer-0");
  await expect(firstAnswer).toBeVisible();
  await firstAnswer.click();
  // After answering, at least one answer option reflects a result state.
  await expect(page.locator(".option.correct, .option.wrong").first()).toBeVisible();
});
