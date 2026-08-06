import { expect, test, type Page } from "@playwright/test";

const widths = [375, 768, 1024, 1280, 1366, 1440, 1920];
const user = {
  id: "1", hoTen: "Nguyễn Minh Anh", email: "qa@rims.local", soDienThoai: "",
  chucVu: "Quản trị hệ thống", khoaPhong: "Phòng Quản lý NCKH", vaiTro: "Administrator",
  ngayTao: "", trangThai: "Hoạt động", initials: "NA", permissions: ["research.view", "training.view"],
};

const longProjectName = "Nghiên cứu đánh giá hiệu quả của mô hình chăm sóc liên ngành, ứng dụng công nghệ số và theo dõi dài hạn cho người bệnh tại nhiều tuyến điều trị trong bối cảnh y tế Việt Nam ".repeat(2);
const ganttProjects = [
  { projectId: 101, projectCode: "NGAN", projectTitle: "Ngắn", departmentName: "Tim mạch", principalInvestigatorName: "Nguyễn An", sponsorName: "Bệnh viện", progressPercent: 25, healthStatus: "on_track", phases: [{ phaseId: 1, phaseName: "Khởi động", plannedStartDate: "2026-01-01", plannedEndDate: "2026-03-31", progressPercent: 50, phaseStatus: "in_progress" }] },
  { projectId: 102, projectCode: "DT-2026-BINH-THUONG", projectTitle: "Nghiên cứu đặc điểm lâm sàng và kết quả điều trị tại bệnh viện", departmentName: "Khoa Nội tổng hợp", principalInvestigatorName: "Trần Bình", sponsorName: "Quỹ nghiên cứu", progressPercent: 40, healthStatus: "at_risk", phases: [{ phaseId: 2, phaseName: "Thu thập", plannedStartDate: "2026-02-01", plannedEndDate: "2026-05-31", progressPercent: 40, phaseStatus: "in_progress" }, { phaseId: 3, phaseName: "Phân tích", plannedStartDate: "2026-06-01", plannedEndDate: "2026-09-30", progressPercent: 0, phaseStatus: "not_started" }] },
  { projectId: 103, projectCode: `CODE-${"X".repeat(100)}`, projectTitle: longProjectName, departmentName: "Khoa Nghiên cứu Y học Chuyên sâu và Hợp tác Quốc tế với tên đặc biệt dài để kiểm tra phép co giãn", principalInvestigatorName: "Lê Chuyên Gia Có Tên Rất Dài", sponsorName: "Chương trình tài trợ nghiên cứu khoa học quốc tế dài hạn", progressPercent: 70, healthStatus: "delayed", phases: Array.from({ length: 5 }, (_, index) => ({ phaseId: 10 + index, phaseName: `Giai đoạn ${index + 1}`, plannedStartDate: `2026-0${index + 1}-01`, plannedEndDate: `2026-0${index + 2}-28`, progressPercent: 20, phaseStatus: "in_progress" })) },
];

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

async function authenticateWithGanttFixture(page: Page) {
  await authenticate(page);
  await page.route("http://localhost:5000/api/dashboard/**", async (route) => {
    const isOverview = route.request().url().includes("research-overview");
    const data = isOverview
      ? { totalProjects: 3, activeProjects: 3, dueSoonCount: 0, overdueCount: 0, averageProgress: 45, ethicsExpiringCount: 0, projectHealthSummary: [], upcomingDeadlines: [], projectsNeedAttention: [], ganttProjects }
      : { upcomingIn7Days: [], upcomingIn30Days: [], overdue: [], ethicsExpiring: [], trainingEventsUpcoming: [] };
    await route.fulfill({ json: { success: true, message: "", errors: [], data } });
  });
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

for (const width of [375, 768, 1024, 1366, 1440, 1920]) {
  test(`Gantt project boundary stays aligned at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await authenticateWithGanttFixture(page);
    await page.goto("/");
    const scroller = page.getByRole("region", { name: "Biểu đồ Gantt có thể cuộn ngang" });
    await expect(page.getByTestId("gantt-project-cell")).toHaveCount(3);

    const assertAligned = async (atScrollOrigin: boolean) => {
      const header = await page.getByTestId("gantt-project-header").boundingBox();
      const projectCells = await page.getByTestId("gantt-project-cell").evaluateAll((elements) => elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { right: rect.right, width: rect.width };
      }));
      const timelineCells = await page.getByTestId("gantt-timeline-cell").evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().left));
      expect(header).not.toBeNull();
      const headerRight = header!.x + header!.width;
      for (const cell of projectCells) {
        expect(Math.abs(cell.width - header!.width)).toBeLessThanOrEqual(1);
        expect(Math.abs(cell.right - headerRight)).toBeLessThanOrEqual(1);
      }
      for (const left of timelineCells) expect(Math.abs(left - timelineCells[0])).toBeLessThanOrEqual(1);
      if (atScrollOrigin) expect(Math.abs(timelineCells[0] - headerRight)).toBeLessThanOrEqual(1);
    };

    await assertAligned(true);
    for (const name of await page.getByTestId("gantt-project-name").all()) {
      const metrics = await name.evaluate((element) => ({ height: element.getBoundingClientRect().height, lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight), title: element.getAttribute("title") }));
      expect(metrics.height / metrics.lineHeight).toBeLessThanOrEqual(2.01);
      expect(metrics.title).toBeTruthy();
    }
    await expectNoPageOverflow(page);
    await scroller.evaluate((element) => { element.scrollLeft = element.scrollWidth / 2; });
    await assertAligned(false);
    await page.screenshot({ path: testInfo.outputPath(`gantt-${width}-middle.png`), fullPage: true });

    if (width >= 1024) {
      await page.getByRole("button", { name: /thu gọn thanh bên|mở rộng thanh bên/i }).click();
      await page.waitForTimeout(300); // Wait for the sidebar/content-width transition to settle.
      await assertAligned(false);
      await page.screenshot({ path: testInfo.outputPath(`gantt-${width}-sidebar-toggled.png`), fullPage: true });
    }
  });
}
