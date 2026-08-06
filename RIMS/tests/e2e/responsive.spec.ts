import { expect, test, type Page } from "@playwright/test";

const widths = [375, 768, 1024, 1280, 1366, 1440, 1920];
const user = {
  id: "1", hoTen: "Nguyễn Minh Anh", email: "qa@rims.local", soDienThoai: "",
  chucVu: "Quản trị hệ thống", khoaPhong: "Phòng Quản lý NCKH", vaiTro: "Administrator",
  ngayTao: "", trangThai: "Hoạt động", initials: "NA", permissions: ["research.view", "training.view"],
};

async function authenticate(page: Page) {
  await page.route("http://localhost:5000/api/**", async (route) => {
    if (route.request().url().endsWith("/auth/me")) {
      await route.fulfill({ json: { success: true, data: {
        userId: 1, username: "qa", email: user.email, fullName: user.hoTen,
        initials: user.initials, title: user.chucVu, departmentName: user.khoaPhong,
        accountStatus: "active", isSystemAdmin: true, mustChangePassword: false,
        roles: [{ roleId: 1, roleCode: "admin", roleName: "Administrator" }], permissions: user.permissions,
      } } });
      return;
    }
    await route.fulfill({ json: { success: false, message: "Visual-test fixture", data: null }, status: 503 });
  });
  await page.addInitScript(({ cachedUser }) => {
    localStorage.setItem("rms.accessToken", "visual-test-token");
    localStorage.setItem("rms.user", JSON.stringify(cachedUser));
  }, { cachedUser: user });
}

async function expectNoPageOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
}

for (const width of widths) {
  test(`layout has no page overflow at ${width}px with both sidebar states`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await authenticate(page);
    await page.goto("/");
    await expect(page.getByRole("button", { name: /thanh bên/ })).toBeVisible();
    await expectNoPageOverflow(page);

    await page.getByRole("button", { name: /thanh bên/ }).click();
    await expectNoPageOverflow(page);
    if (width < 1024) await page.getByRole("button", { name: "Đóng menu", exact: true }).first().click();
  });
}

test("research and training tables stay inside their own scroll regions", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await authenticate(page);
  await page.goto("/");

  for (const destination of ["Đề tài nghiên cứu", "Mảng đào tạo"]) {
    await page.getByRole("button", { name: /thanh bên/ }).click();
    await page.getByRole("button", { name: destination, exact: true }).click();
    if (destination === "Mảng đào tạo") {
      await page.getByRole("button", { name: "Danh sách sự kiện", exact: true }).click();
    }
    await expectNoPageOverflow(page);
    await page.screenshot({ path: testInfo.outputPath(`${destination === "Mảng đào tạo" ? "training" : "research"}-375.png`), fullPage: true });
  }
});

test("training export downloads a real XLSX workbook", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await authenticate(page);
  await page.goto("/");
  await page.getByRole("button", { name: /thanh bên/ }).click();
  await page.getByRole("button", { name: "Mảng đào tạo", exact: true }).click();
  await page.getByRole("button", { name: "Danh sách sự kiện", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất Excel (.xlsx)" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^training-events-\d{8}\.xlsx$/);
});
