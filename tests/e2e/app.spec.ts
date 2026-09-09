import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("data-ready", "true", {
    timeout: 15000,
  });
});
test("delete confirmation and custom settings", async ({ page }) => {
  await page.getByRole("button", { name: "Save Build", exact: true }).click();
  await page.getByRole("tab", { name: "Saved Builds", exact: true }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByLabel("Rename Two-Way Shot Creator")).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm delete", exact: true })
    .click();
  await expect(
    page.getByText("No saved builds yet.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Settings / About" }).click();
  await page.getByLabel("shooting weight", { exact: true }).fill("3");
  await expect(
    page.getByRole("combobox", { name: "Optimization preset" }),
  ).toContainText("Custom");
  await page
    .getByRole("button", { name: "Reset settings", exact: true })
    .click();
  await expect(page.getByLabel("shooting weight", { exact: true })).toHaveValue(
    "1",
  );
});
test("demo optimization, editing, saving and loading", async ({ page }) => {
  await expect(
    page.getByText("MEASURED DATA / TUNING SNAPSHOT", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Load Demo Build" }).click();
  await page
    .getByRole("button", { name: "OPTIMIZE BADGES", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Optimization results" }),
  ).toBeVisible();
  await page.getByLabel("Build name", { exact: true }).fill("My test build");
  await expect(
    page.getByRole("region", { name: "Optimization results" }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Save Build", exact: true }).click();
  await page.getByRole("tab", { name: "Saved Builds", exact: true }).click();
  await expect(page.getByLabel("Rename My test build")).toBeVisible();
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await expect(
    page.getByLabel("Rename My test build (copy)", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Rename My test build", { exact: true })
    .fill("Renamed build");
  await page
    .getByRole("heading", { name: "Saved builds", exact: true })
    .click();
  await page.reload();
  await page.getByRole("tab", { name: "Saved Builds", exact: true }).click();
  await expect(page.getByLabel("Rename Renamed build")).toBeVisible();
  await page.getByRole("button", { name: "Load", exact: true }).first().click();
  await expect(page.getByLabel("Build name", { exact: true })).toHaveValue(
    "Renamed build",
  );
});
test("import validation, export, database and responsive layout", async ({
  page,
}) => {
  await page.getByLabel("Import build JSON").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Import failed",
  );
  await page.getByRole("button", { name: "Load Demo Build" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Build" }).click();
  const file = await download;
  await page
    .getByLabel("Import build JSON")
    .setInputFiles((await file.path())!);
  await expect(page.getByRole("status")).toContainText("Build imported");
  await page.getByRole("tab", { name: "Badge Database" }).click();
  await page.getByLabel("Search badges").fill("Deep Threat");
  await expect(
    page.getByRole("heading", { name: "Deep Threat", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Soft Touch", exact: true }),
  ).not.toBeVisible();
  await page.getByText("Requirements & source", { exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "Three-Point Shot ≥ 60", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("validation, locks and exclusion affect results", async ({ page }) => {
  await page.getByLabel("Badge tokens", { exact: true }).fill("-1");
  await page
    .getByRole("button", { name: "OPTIMIZE BADGES", exact: true })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "resources.tokens",
  );
  await page.getByLabel("Badge tokens", { exact: true }).fill("12");
  await page
    .getByText("Lock, exclude & prioritize badges", { exact: true })
    .click();
  await page.getByRole("combobox", { name: "Deep Threat allocation" }).click();
  await page.getByRole("option", { name: "Exclude", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Floor General allocation" })
    .click();
  await page.getByRole("option", { name: "Lock Gold", exact: true }).click();
  await page
    .getByRole("button", { name: "OPTIMIZE BADGES", exact: true })
    .click();
  const region = page.getByRole("region", { name: "Optimization results" });
  await expect(region).toBeVisible();
  await expect(
    region.locator("article").filter({ hasText: "Floor General" }),
  ).toBeVisible();
  await expect(
    region.locator("article").filter({ hasText: "Deep Threat" }),
  ).toHaveCount(0);
});
