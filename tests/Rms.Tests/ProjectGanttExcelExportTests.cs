using ClosedXML.Excel;
using Rms.Application.Reports;
using Rms.Infrastructure.Services;

namespace Rms.Tests;

public sealed class ProjectGanttExcelExportTests
{
    [Fact]
    public void CalculateWorkingDays_ExcludesWeekends()
    {
        var days = ProjectTimelineExportLogic.CalculateWorkingDays(
            new DateOnly(2026, 1, 1),
            new DateOnly(2026, 1, 11));

        Assert.Equal(7, days);
    }

    [Theory]
    [InlineData(180, ProjectTimelineTimeScale.Day)]
    [InlineData(181, ProjectTimelineTimeScale.Week)]
    [InlineData(540, ProjectTimelineTimeScale.Week)]
    [InlineData(541, ProjectTimelineTimeScale.Month)]
    public void ResolveTimeScale_Auto_UsesConfiguredThresholds(int days, ProjectTimelineTimeScale expected)
    {
        var start = new DateOnly(2026, 1, 1);
        var end = start.AddDays(days - 1);

        var scale = ProjectTimelineExportLogic.ResolveTimeScale(ProjectTimelineTimeScale.Auto, start, end);

        Assert.Equal(expected, scale);
    }

    [Fact]
    public void Overlaps_DetectsPeriodOverlap()
    {
        Assert.True(ProjectTimelineExportLogic.Overlaps(
            new DateOnly(2026, 1, 5),
            new DateOnly(2026, 1, 10),
            new DateOnly(2026, 1, 10),
            new DateOnly(2026, 1, 16)));
        Assert.False(ProjectTimelineExportLogic.Overlaps(
            new DateOnly(2026, 1, 5),
            new DateOnly(2026, 1, 10),
            new DateOnly(2026, 1, 11),
            new DateOnly(2026, 1, 16)));
    }

    [Fact]
    public void SanitizeFileName_RemovesInvalidCharacters()
    {
        var sanitized = ProjectTimelineExportLogic.SanitizeFileName("RIMS:ABC/01*?");

        Assert.DoesNotContain(':', sanitized);
        Assert.DoesNotContain('/', sanitized);
        Assert.DoesNotContain('*', sanitized);
        Assert.DoesNotContain('?', sanitized);
    }

    [Fact]
    public void TimelineRows_CanBeOrderedByWbs()
    {
        var rows = SampleTimeline().Rows.OrderBy(x => x.Wbs, StringComparer.OrdinalIgnoreCase).Select(x => x.Wbs).ToList();

        Assert.Equal(new[] { "1", "1.1", "1.1.1", "1.1.D1", "1.2" }, rows);
    }

    [Fact]
    public void GenerateWorkbook_WithNoActualDates_LeavesActualRowTimelineEmpty()
    {
        using var workbook = OpenSampleWorkbook();
        var sheet = workbook.Worksheet("Tiến độ dự án");

        Assert.Equal("Thực tế", sheet.Cell(15, 2).GetString().Trim());
        Assert.Equal("Chưa có thực tế", sheet.Cell(15, 7).GetString());
    }

    [Fact]
    public void GenerateWorkbook_RendersMilestoneMarker()
    {
        using var workbook = OpenSampleWorkbook();
        var sheet = workbook.Worksheet("Tiến độ dự án");

        Assert.Equal("◆", sheet.Cell(12, 18).GetString());
    }

    [Fact]
    public void GenerateWorkbook_RendersOverdueDeadline()
    {
        using var workbook = OpenSampleWorkbook();
        var sheet = workbook.Worksheet("Tiến độ dự án");

        Assert.Equal("!", sheet.Cell(13, 11).GetString());
        Assert.Equal("Submit IRB", sheet.Cell(13, 2).GetString().Trim());
    }

    [Fact]
    public void GenerateWorkbook_ContainsExpectedWorksheetMetadataAndColumns()
    {
        using var workbook = OpenSampleWorkbook();
        var sheet = workbook.Worksheet("Tiến độ dự án");

        Assert.Equal("BÁO CÁO TIẾN ĐỘ DỰ ÁN", sheet.Cell(1, 1).GetString());
        Assert.Equal("RIMS-001", sheet.Cell(2, 2).GetString());
        Assert.Equal("Phụ trách", sheet.Cell(2, 3).GetString());
        Assert.DoesNotContain("PHỤ TRÁCH", Enumerable.Range(1, 6).Select(column => sheet.Cell(7, column).GetString()));
        Assert.DoesNotContain("WORK DAYS", Enumerable.Range(1, 6).Select(column => sheet.Cell(7, column).GetString()));
        Assert.DoesNotContain("TYPE / STATUS", Enumerable.Range(1, 6).Select(column => sheet.Cell(7, column).GetString()));
        Assert.Equal("Thang thời gian", sheet.Cell(6, 1).GetString());
        Assert.Equal("Week 1\n01/01 - 07/01", sheet.Cell(7, 7).GetString());
        Assert.Equal("Week 2\n08/01 - 14/01", sheet.Cell(7, 14).GetString());
    }

    [Fact]
    public void GenerateWorkbook_CanBeReopenedByClosedXml()
    {
        var bytes = ProjectGanttExcelService.GenerateWorkbook(
            SampleTimeline(),
            new ProjectTimelineExportOptions { IncludeActual = true });

        using var stream = new MemoryStream(bytes);
        using var workbook = new XLWorkbook(stream);

        Assert.Contains(workbook.Worksheets, x => x.Name == "Tiến độ dự án");
    }

    private static XLWorkbook OpenSampleWorkbook()
    {
        var bytes = ProjectGanttExcelService.GenerateWorkbook(
            SampleTimeline(),
            new ProjectTimelineExportOptions { IncludeActual = true });

        return new XLWorkbook(new MemoryStream(bytes));
    }

    private static ProjectTimelineDto SampleTimeline()
    {
        var rows = new List<ProjectTimelineRowDto>
        {
            new("project:1", null, ProjectTimelineRowType.Project, "1", "Clinical Research", "Dr A", new DateOnly(2026, 1, 1), new DateOnly(2026, 1, 31), null, null, 40m, 22, 0, 0, true, "in_progress", "low", false, false, false),
            new("phase:1", "project:1", ProjectTimelineRowType.Phase, "1.1", "Protocol", "Dr B", new DateOnly(2026, 1, 1), new DateOnly(2026, 1, 10), new DateOnly(2026, 1, 2), new DateOnly(2026, 1, 8), 60m, 7, 1, 1, true, "in_progress", "low", false, false, false),
            new("deadline:1", "phase:1", ProjectTimelineRowType.Deadline, "1.1.D1", "Submit IRB", "Dr C", new DateOnly(2026, 1, 5), new DateOnly(2026, 1, 5), null, null, 0m, 0, 2, 2, false, "open", "high", true, false, true),
            new("milestone:1", "phase:1", ProjectTimelineRowType.Milestone, "1.1.1", "Approval", "Dr C", new DateOnly(2026, 1, 12), new DateOnly(2026, 1, 12), new DateOnly(2026, 1, 12), new DateOnly(2026, 1, 12), 100m, 0, 2, 3, false, "completed", "normal", false, true, false),
            new("phase:2", "project:1", ProjectTimelineRowType.Phase, "1.2", "Recruitment", "Dr D", new DateOnly(2026, 1, 15), new DateOnly(2026, 1, 31), null, null, 0m, 12, 1, 4, false, "not_started", "low", false, false, false),
        };

        return new ProjectTimelineDto(
            1,
            "RIMS-001",
            "Clinical Research",
            "Dr A",
            "Research Department",
            new DateOnly(2026, 1, 1),
            new DateOnly(2026, 1, 31),
            null,
            null,
            40m,
            "in_progress",
            "low",
            "on_track",
            new DateTime(2026, 1, 15, 9, 30, 0),
            ProjectTimelineTimeScale.Day,
            new DateOnly(2026, 1, 1),
            new DateOnly(2026, 1, 31),
            rows.OrderBy(x => x.Wbs, StringComparer.OrdinalIgnoreCase).ToList());
    }
}
