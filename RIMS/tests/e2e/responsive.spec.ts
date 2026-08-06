import { expect, test, type Page } from "@playwright/test";

const widths = [375, 768, 1024, 1280, 1366, 1440, 1920];
const user = {
  id: "1", hoTen: "Nguyễn Minh Anh", email: "qa@rims.local", soDienThoai: "",
  chucVu: "Quản trị hệ thống", khoaPhong: "Phòng Quản lý NCKH", vaiTro: "Administrator",
  ngayTao: "", trangThai: "Hoạt động", initials: "NA", permissions: ["research.view", "training.view"],
};

const longProjectName = "Nghiên cứu đa trung tâm đánh giá hiệu quả quản lý toàn diện người bệnh có tên đề tài tiếng Việt đặc biệt dài trong điều kiện thực hành lâm sàng tại bệnh viện";
const longDepartment = "Phòng Quản lý Nghiên cứu Khoa học, Đào tạo, Hợp tác quốc tế và Phát triển chuyên môn kỹ thuật chuyên sâu";

const ganttProjects = Array.from({ length: 12 }, (_, index) => ({
  projectId: index + 1,
  projectCode: `RIMS-2026-MÃ-ĐỀ-TÀI-RẤT-DÀI-${String(index + 1).padStart(3, "0")}`,
  projectTitle: `${longProjectName} — nhóm nghiên cứu số ${index + 1}`,
  departmentName: longDepartment,
  principalInvestigatorName: "PGS.TS.BS.CKII. Nguyễn Thị Minh Anh với tên người phụ trách rất dài",
  sponsorName: "Chương trình tài trợ nghiên cứu khoa học và đổi mới sáng tạo cấp quốc gia",
  progressPercent: 35 + index,
  healthStatus: "on_track",
  phases: [{
    phaseId: index + 1, phaseName: `Giai đoạn thu thập, chuẩn hóa và phân tích dữ liệu chuyên sâu số ${index + 1}`,
    plannedStartDate: "2026-01-01", plannedEndDate: "2026-12-20",
    actualStartDate: "2026-01-10", actualEndDate: null,
    progressPercent: 40, phaseStatus: "in_progress",
  }],
}));

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
    if (route.request().url().includes("/dashboard/research-overview")) {
      await route.fulfill({ json: { success: true, data: {
        totalProjects: ganttProjects.length, activeProjects: ganttProjects.length,
        dueSoonCount: 0, overdueCount: 0, averageProgress: 42, ethicsExpiringCount: 0,
        projectHealthSummary: [], upcomingDeadlines: [], projectsNeedAttention: [], ganttProjects,
      } } });
      return;
    }
    if (route.request().url().includes("/dashboard/deadlines")) {
      await route.fulfill({ json: { success: true, data: { upcomingIn7Days: [], upcomingIn30Days: [], overdue: [], ethicsExpiring: [], trainingEventsUpcoming: [] } } });
      return;
    }
    if (route.request().url().includes("/research-projects")) {
      await route.fulfill({ json: { success: true, data: {
        items: ganttProjects.map((project) => ({
          projectId: project.projectId, projectCode: project.projectCode, projectTitle: project.projectTitle,
          departmentName: project.departmentName, principalInvestigatorName: project.principalInvestigatorName,
          sponsorName: project.sponsorName, ethicsStatus: "approved", progressPercent: project.progressPercent,
          projectStatus: "in_progress", riskLevel: "low", currentPhaseName: project.phases[0].phaseName,
        })), page: 1, pageSize: 100, totalCount: ganttProjects.length, totalPages: 1,
      } } });
      return;
    }
    if (route.request().url().includes("/project-phases")) {
      await route.fulfill({ json: { success: true, data: { items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0 } } });
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

for (const width of widths) {
  test(`Progress Overview controls and Gantt remain responsive at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await authenticate(page);
    await page.goto("/");
    await expect(page.getByText(longProjectName, { exact: false }).first()).toBeVisible();
    await expectNoPageOverflow(page);

    const filterCard = page.locator(".overview-control-grid");
    await expect(filterCard).toBeVisible();
    expect((await filterCard.boundingBox())!.width).toBeLessThanOrEqual(width);

    const kpis = page.locator(".overview-kpi-grid > *");
    const firstKpi = await kpis.first().boundingBox();
    expect(firstKpi!.width).toBeGreaterThan(120);

    const triggers = page.locator('[data-slot="select-trigger"]');
    for (let index = 0; index < await triggers.count(); index++) {
      const trigger = triggers.nth(index);
      const parentBox = await trigger.locator("xpath=..").boundingBox();
      const triggerBox = await trigger.boundingBox();
      expect(triggerBox!.width).toBeLessThanOrEqual(parentBox!.width + 1);
    }

    await triggers.first().focus();
    await page.keyboard.press("Enter");
    const popup = page.locator('[data-slot="select-content"]');
    await expect(popup).toBeVisible();
    const popupBox = await popup.boundingBox();
    expect(popupBox!.x).toBeGreaterThanOrEqual(0);
    expect(popupBox!.x + popupBox!.width).toBeLessThanOrEqual(width + 1);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();

    for (const mode of ["Theo quý", "Nửa năm", "Cả năm", "Tùy chỉnh"]) {
      await page.getByRole("button", { name: new RegExp(`^${mode}`) }).click();
      await expectNoPageOverflow(page);
    }

    const gantt = page.locator(".gantt-scroll-region");
    const ganttNeedsScroll = await gantt.evaluate((element) => element.scrollWidth > element.clientWidth);
    expect(ganttNeedsScroll).toBe(width < 1920);
    const sticky = gantt.locator(".gantt-project-column").first();
    const before = await sticky.boundingBox();
    await gantt.evaluate((element) => { element.scrollLeft = 700; });
    const after = await sticky.boundingBox();
    expect(Math.abs(after!.x - before!.x)).toBeLessThan(2);
    await expect(page.getByRole("button", { name: "Chi tiết" }).first()).toBeVisible();
    if (width === 375 || width === 1366) {
      await page.screenshot({ path: testInfo.outputPath(`progress-overview-${width}.png`), fullPage: true });
    }
  });
}

test("long project combobox options remain readable and viewport-safe", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await authenticate(page);
  await page.goto("/");
  await page.getByRole("button", { name: /thanh bên/ }).click();
  await page.getByRole("button", { name: "Giai đoạn", exact: true }).click();
  const trigger = page.locator('[data-slot="select-trigger"]').first();
  await trigger.click();
  const popup = page.locator('[data-slot="select-content"]');
  const option = page.getByRole("option", { name: new RegExp("RIMS-2026-MÃ-ĐỀ-TÀI") }).first();
  await expect(option).toBeVisible();
  await expect(option).toContainText(longProjectName);
  const popupBox = await popup.boundingBox();
  expect(popupBox!.x).toBeGreaterThanOrEqual(0);
  expect(popupBox!.x + popupBox!.width).toBeLessThanOrEqual(376);
  await page.screenshot({ path: testInfo.outputPath("long-project-combobox-375.png"), fullPage: true });
  await page.keyboard.press("Escape");
  await expectNoPageOverflow(page);
});

test("button semantics and compact icon sizing remain safe", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await authenticate(page);
  await page.goto("/");
  const missingTypes = await page.locator('button:not([type]):not([aria-label="Open Next.js Dev Tools"])').count();
  expect(missingTypes).toBe(0);
  const sidebarToggle = page.getByRole("button", { name: /thanh bên/ });
  const box = await sidebarToggle.boundingBox();
  expect(Math.abs(box!.width - box!.height)).toBeLessThan(2);
  await expect(sidebarToggle).toHaveAttribute("aria-label", /thanh bên/);
});

test("select popup remains viewport-safe inside a narrow dialog", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await authenticate(page);
  await page.goto("/");
  await page.getByRole("button", { name: /thanh bên/ }).click();
  await page.getByRole("button", { name: "Đề tài nghiên cứu", exact: true }).click();
  await page.getByRole("button", { name: "Thêm đề tài", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const dialogBox = await dialog.boundingBox();
  expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(375);
  const trigger = dialog.locator('[data-slot="select-trigger"]').first();
  await trigger.click();
  const popupBox = await page.locator('[data-slot="select-content"]').boundingBox();
  expect(popupBox!.x).toBeGreaterThanOrEqual(0);
  expect(popupBox!.x + popupBox!.width).toBeLessThanOrEqual(375);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expectNoPageOverflow(page);
});
