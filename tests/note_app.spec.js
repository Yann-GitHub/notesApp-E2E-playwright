const { test, describe, expect, beforeEach } = require("@playwright/test");
const { loginWith } = require("./helper");

describe("Note app", () => {
  beforeEach(async ({ page, request }) => {
    await request.delete("http://localhost:3001/api/testing/reset");
    await request.post("http://localhost:3001/api/users", {
      data: {
        name: "Matti Luukkainen",
        username: "mluukkai",
        password: "salainen",
      },
    });

    await page.goto("http://localhost:5173");
  });

  test("front page can be opened", async ({ page }) => {
    const locator = await page.getByText("Notes");
    await expect(locator).toBeVisible();
    await expect(page.getByText("Note app, 2023-2024")).toBeVisible();
  });

  test("login fails with wrong password", async ({ page }) => {
    await loginWith(page, "mluukkai", "wrong");
    await expect(page.getByText(/Wrong credentials/)).toBeVisible();

    const errorDiv = await page.locator(".toast.toastError");
    await expect(errorDiv).toContainText(/Wrong credentials/);
    await expect(errorDiv).toHaveCSS("border-style", "solid");
    await expect(errorDiv).toHaveCSS("color", "rgb(255, 0, 0)");

    await expect(
      page.getByText("Matti Luukkainen logged in")
    ).not.toBeVisible();
  });

  test("login form can be opened", async ({ page }) => {
    await loginWith(page, "mluukkai", "salainen");
    await expect(page.getByText("logged-in")).toBeVisible();
  });

  describe("when logged in", () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, "mluukkai", "salainen");
    });

    test("a new note can be created", async ({ page }) => {
      await page.getByRole("button", { name: "new note" }).click();
      await page.getByRole("textbox").fill("a note created by playwright");
      await page.getByRole("button", { name: "save" }).click();
      await expect(
        page.getByText("a note created by playwright")
      ).toBeVisible();
    });

    describe("and a note exists", () => {
      beforeEach(async ({ page }) => {
        await page.getByRole("button", { name: "new note" }).click();
        await page.getByRole("textbox").fill("another note by playwright");
        await page.getByRole("button", { name: "save" }).click();
      });
      test("importance can be changed", async ({ page }) => {
        await page
          .getByRole("button", { name: "make important" })
          .first()
          .click();
        await expect(page.getByText("make not important")).toBeVisible();
      });
    });
  });
});
