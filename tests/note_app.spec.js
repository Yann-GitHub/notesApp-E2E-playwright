const { test, describe, expect, beforeEach } = require("@playwright/test");
const { loginWith, createNote } = require("./helper");

describe("Note app", () => {
  beforeEach(async ({ page, request }) => {
    await request.delete("/api/testing/reset");
    await request.post("/api/users", {
      data: {
        name: "Matti Luukkainen",
        username: "mluukkai",
        password: "salainen",
      },
    });

    await page.goto("/");
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
      await createNote(page, "a note created by playwright");
      await expect(
        page.getByText("a note created by playwright")
      ).toBeVisible();
    });

    describe("and a note exists", () => {
      beforeEach(async ({ page }) => {
        // await createNote(page, "another note by playwright");
        await createNote(page, "first note");
        await createNote(page, "second note");
        await createNote(page, "third note");
      });
      test("importance can be changed", async ({ page }) => {
        // await page
        //   .getByRole("button", { name: "make important" })
        //   .first()
        //   .click();
        // await expect(page.getByText("make not important")).toBeVisible();
        await page.pause(); // pause the test for debugging
        const otherNoteText = await page.getByText("second note");
        const otherdNoteElement = await otherNoteText.locator("..");

        await otherdNoteElement
          .getByRole("button", { name: "make important" })
          .click();
        await expect(
          otherdNoteElement.getByText("make not important")
        ).toBeVisible();
      });
    });
  });
});
