using ClosedXML.Excel;
using Rms.Application.Reports;

namespace Rms.Infrastructure.Services;

public sealed class ProjectGanttExcelService : IProjectGanttExcelService
{
    public const string ExcelContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private const string WorksheetName = "Tiến độ dự án";
    private const int FirstHeaderRow = 7;
    private const int LastHeaderRow = 9;
    private const int FirstDataRow = 10;
    private const int FirstTimelineColumn = 7;
    private const int MissingTimelineLabelColumns = 4;

    private readonly IProjectTimelineQueryService _timelineQueryService;

    public ProjectGanttExcelService(IProjectTimelineQueryService timelineQueryService)
    {
        _timelineQueryService = timelineQueryService;
    }

    public async Task<ExportedFile> ExportProjectGanttAsync(
        long projectId,
        ProjectTimelineExportOptions options,
        CancellationToken cancellationToken = default)
    {
        var timeline = await _timelineQueryService.GetProjectTimelineAsync(projectId, options, cancellationToken);
        var content = GenerateWorkbook(timeline, options);
        var fileName = $"TienDo_{ProjectTimelineExportLogic.SanitizeFileName(timeline.ProjectCode)}_{timeline.GeneratedAt:yyyyMMdd_HHmmss}.xlsx";
        return new ExportedFile(fileName, ExcelContentType, content);
    }

    public static byte[] GenerateWorkbook(ProjectTimelineDto timeline, ProjectTimelineExportOptions options)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add(WorksheetName);
        worksheet.TabColor = GanttExcelTheme.TitleFill;

        var periods = ProjectTimelineExportLogic.BuildPeriods(timeline.TimelineStart, timeline.TimelineEnd, timeline.SelectedTimeScale);
        BuildMetadata(worksheet, timeline, periods.Count);
        BuildHeaders(worksheet, periods);
        var lastRow = RenderRows(worksheet, timeline, options, periods);
        ApplyLayout(worksheet, periods.Count, lastRow);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void BuildMetadata(IXLWorksheet worksheet, ProjectTimelineDto timeline, int periodCount)
    {
        var lastColumn = Math.Max(FirstTimelineColumn + periodCount - 1, FirstTimelineColumn);
        worksheet.Range(1, 1, 1, lastColumn).Merge();
        worksheet.Cell(1, 1).Value = "BÁO CÁO TIẾN ĐỘ DỰ ÁN";
        ApplyTitleStyle(worksheet.Cell(1, 1));

        SetMetadata(worksheet, 2, 1, "Mã đề tài", timeline.ProjectCode);
        SetMetadata(worksheet, 2, 3, "Phụ trách", timeline.ProjectLeadName);
        SetMetadata(worksheet, 2, 5, "Khoa/Phòng", timeline.DepartmentName);
        SetMetadata(worksheet, 3, 1, "Tên đề tài", timeline.ProjectTitle, valueEndColumn: 4);
        SetMetadata(worksheet, 3, 5, "Trạng thái", timeline.Status);
        SetMetadata(worksheet, 4, 1, "Bắt đầu dự kiến", timeline.PlannedStartDate);
        SetMetadata(worksheet, 4, 3, "Kết thúc dự kiến", timeline.PlannedEndDate);
        SetMetadata(worksheet, 4, 5, "Tiến độ", timeline.ProgressPercent / 100m, "0%");
        SetMetadata(worksheet, 5, 1, "Bắt đầu thực tế", timeline.ActualStartDate);
        SetMetadata(worksheet, 5, 3, "Kết thúc thực tế", timeline.ActualEndDate);
        SetMetadata(worksheet, 5, 5, "Xuất lúc", timeline.GeneratedAt.ToString("dd/MM/yyyy HH:mm"));
        SetMetadata(worksheet, 6, 1, "Thang thời gian", timeline.SelectedTimeScale.ToString());
        SetMetadata(worksheet, 6, 3, "Khoảng xuất", $"{timeline.TimelineStart:dd/MM/yyyy} - {timeline.TimelineEnd:dd/MM/yyyy}");
        SetMetadata(worksheet, 6, 5, "Sức khỏe/Rủi ro", $"{timeline.HealthStatus} / {timeline.RiskLevel}");
    }

    private static void SetMetadata(IXLWorksheet worksheet, int row, int column, string label, object? value, string? numberFormat = null, int? valueEndColumn = null)
    {
        var endColumn = valueEndColumn ?? column + 1;
        worksheet.Cell(row, column).Value = label;
        worksheet.Cell(row, column + 1).Value = value switch
        {
            DateOnly date => date.ToDateTime(TimeOnly.MinValue),
            null => string.Empty,
            _ => XLCellValue.FromObject(value)
        };

        worksheet.Range(row, column + 1, row, endColumn).Merge();
        ApplyMetadataLabelStyle(worksheet.Cell(row, column));
        ApplyMetadataValueStyle(worksheet.Range(row, column + 1, row, endColumn));
        if (value is DateOnly)
        {
            worksheet.Cell(row, column + 1).Style.DateFormat.Format = "dd/MM/yyyy";
        }
        else if (!string.IsNullOrWhiteSpace(numberFormat))
        {
            worksheet.Cell(row, column + 1).Style.NumberFormat.Format = numberFormat;
        }
    }

    private static void BuildHeaders(IXLWorksheet worksheet, IReadOnlyList<ProjectTimelinePeriod> periods)
    {
        var fixedHeaders = new[] { "WBS", "HẠNG MỤC", "BẮT ĐẦU", "KẾT THÚC", "DAYS", "% DONE" };
        for (var i = 0; i < fixedHeaders.Length; i++)
        {
            var range = worksheet.Range(FirstHeaderRow, i + 1, LastHeaderRow, i + 1);
            range.Merge();
            range.Value = fixedHeaders[i];
            ApplyMainHeaderStyle(range);
        }

        var groupStartIndex = 0;
        for (var index = 0; index < periods.Count; index++)
        {
            var period = periods[index];
            var column = FirstTimelineColumn + index;
            worksheet.Cell(FirstHeaderRow + 1, column).Value = period.SubHeader;
            worksheet.Cell(LastHeaderRow, column).Value = period.Start == period.End
                ? GetVietnameseWeekday(period.Start.DayOfWeek)
                : $"{period.Start:dd/MM} - {period.End:dd/MM}";
            ApplyTimelineHeaderStyle(worksheet.Range(FirstHeaderRow + 1, column, LastHeaderRow, column), period.IsWeekend);

            var isLastInGroup = index == periods.Count - 1 || periods[index + 1].Header != period.Header;
            if (!isLastInGroup)
            {
                continue;
            }

            var groupStartColumn = FirstTimelineColumn + groupStartIndex;
            var groupEndColumn = FirstTimelineColumn + index;
            var groupRange = worksheet.Range(FirstHeaderRow, groupStartColumn, FirstHeaderRow, groupEndColumn);
            groupRange.Merge();
            groupRange.Value = BuildTimelineGroupHeader(periods[groupStartIndex], periods[index]);
            ApplyTimelineGroupHeaderStyle(groupRange);
            groupStartIndex = index + 1;
        }
    }

    private static int RenderRows(IXLWorksheet worksheet, ProjectTimelineDto timeline, ProjectTimelineExportOptions options, IReadOnlyList<ProjectTimelinePeriod> periods)
    {
        var rowIndex = FirstDataRow;
        foreach (var row in timeline.Rows)
        {
            var usesActualRow = options.IncludeActual && !row.IsGroup && !row.IsMilestone && !row.IsDeadline;
            FillInfoCells(worksheet, rowIndex, row);
            ApplyRowBaseStyle(worksheet.Range(rowIndex, 1, rowIndex, FirstTimelineColumn + periods.Count - 1), row);
            RenderTimeline(worksheet, rowIndex, row, periods, useActualDates: false);

            if (usesActualRow)
            {
                rowIndex++;
                FillActualInfoCells(worksheet, rowIndex, row);
                ApplyRowBaseStyle(worksheet.Range(rowIndex, 1, rowIndex, FirstTimelineColumn + periods.Count - 1), row);
                RenderTimeline(worksheet, rowIndex, row, periods, useActualDates: true);
            }

            rowIndex++;
        }

        return Math.Max(rowIndex - 1, FirstDataRow);
    }

    private static void FillInfoCells(IXLWorksheet worksheet, int rowIndex, ProjectTimelineRowDto row)
    {
        worksheet.Cell(rowIndex, 1).Value = row.Wbs;
        worksheet.Cell(rowIndex, 2).Value = $"{new string(' ', row.HierarchyLevel * 3)}{row.Name}";
        SetDateCell(worksheet.Cell(rowIndex, 3), row.PlannedStartDate);
        SetDateCell(worksheet.Cell(rowIndex, 4), row.PlannedEndDate);
        if (row.IsMilestone || row.IsDeadline)
        {
            worksheet.Cell(rowIndex, 5).Value = string.Empty;
        }
        else
        {
            worksheet.Cell(rowIndex, 5).Value = CalendarDays(row.PlannedStartDate, row.PlannedEndDate);
        }

        worksheet.Cell(rowIndex, 6).Value = row.ProgressPercent / 100m;
        worksheet.Cell(rowIndex, 6).Style.NumberFormat.Format = "0%";
    }

    private static void FillActualInfoCells(IXLWorksheet worksheet, int rowIndex, ProjectTimelineRowDto row)
    {
        worksheet.Cell(rowIndex, 1).Value = string.Empty;
        worksheet.Cell(rowIndex, 2).Value = "  Thực tế";
        SetDateCell(worksheet.Cell(rowIndex, 3), row.ActualStartDate);
        SetDateCell(worksheet.Cell(rowIndex, 4), row.ActualEndDate);
        worksheet.Cell(rowIndex, 5).Value = row.ActualStartDate.HasValue || row.ActualEndDate.HasValue
            ? CalendarDays(row.ActualStartDate, row.ActualEndDate)
            : string.Empty;
        worksheet.Cell(rowIndex, 6).Value = row.ProgressPercent / 100m;
        worksheet.Cell(rowIndex, 6).Style.NumberFormat.Format = "0%";
    }

    private static void RenderTimeline(IXLWorksheet worksheet, int rowIndex, ProjectTimelineRowDto row, IReadOnlyList<ProjectTimelinePeriod> periods, bool useActualDates)
    {
        var start = useActualDates ? row.ActualStartDate : row.PlannedStartDate;
        var end = useActualDates ? row.ActualEndDate : row.PlannedEndDate;

        for (var index = 0; index < periods.Count; index++)
        {
            var period = periods[index];
            var cell = worksheet.Cell(rowIndex, FirstTimelineColumn + index);
            if (period.IsWeekend)
            {
                cell.Style.Fill.BackgroundColor = GanttExcelTheme.WeekendFill;
            }
        }

        if (row.IsMilestone || row.IsDeadline)
        {
            RenderMarker(worksheet, rowIndex, row, periods);
            return;
        }

        if (!start.HasValue || !end.HasValue)
        {
            RenderMissingTimelineLabel(
                worksheet,
                rowIndex,
                periods.Count,
                useActualDates ? "Chưa có thực tế" : "Chưa có dự kiến");
            return;
        }

        var safeEnd = end.Value < start.Value ? start.Value : end.Value;
        var totalPeriods = periods.Count(x => ProjectTimelineExportLogic.Overlaps(start.Value, safeEnd, x.Start, x.End));
        var completedPeriods = useActualDates
            ? totalPeriods
            : (int)Math.Round(totalPeriods * (double)Math.Clamp(row.ProgressPercent, 0m, 100m) / 100d, MidpointRounding.AwayFromZero);
        var filled = 0;

        foreach (var (period, index) in periods.Select((value, index) => (value, index)))
        {
            if (!ProjectTimelineExportLogic.Overlaps(start.Value, safeEnd, period.Start, period.End))
            {
                continue;
            }

            var cell = worksheet.Cell(rowIndex, FirstTimelineColumn + index);
            if (row.IsOverdue && !useActualDates)
            {
                cell.Style.Fill.BackgroundColor = GanttExcelTheme.OverdueFill;
            }
            else if (useActualDates)
            {
                cell.Style.Fill.BackgroundColor = GanttExcelTheme.ActualFill;
            }
            else if (filled < completedPeriods)
            {
                cell.Style.Fill.BackgroundColor = GanttExcelTheme.CompletedFill;
            }
            else
            {
                cell.Style.Fill.BackgroundColor = GanttExcelTheme.PlannedFill;
            }

            filled++;
        }
    }

    private static void RenderMarker(IXLWorksheet worksheet, int rowIndex, ProjectTimelineRowDto row, IReadOnlyList<ProjectTimelinePeriod> periods)
    {
        var markerDate = row.PlannedEndDate ?? row.PlannedStartDate;
        if (!markerDate.HasValue)
        {
            return;
        }

        var periodIndex = periods.ToList().FindIndex(x => markerDate.Value >= x.Start && markerDate.Value <= x.End);
        if (periodIndex < 0)
        {
            return;
        }

        var cell = worksheet.Cell(rowIndex, FirstTimelineColumn + periodIndex);
        cell.Value = row.IsMilestone ? "◆" : "!";
        cell.Style.Font.Bold = true;
        cell.Style.Font.FontColor = XLColor.White;
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        cell.Style.Fill.BackgroundColor = row.IsDeadline || row.IsOverdue ? GanttExcelTheme.DeadlineFill : GanttExcelTheme.MilestoneFill;
        cell.Style.Border.OutsideBorder = XLBorderStyleValues.Medium;
    }

    private static void ApplyLayout(IXLWorksheet worksheet, int periodCount, int lastRow)
    {
        var lastColumn = Math.Max(FirstTimelineColumn + periodCount - 1, FirstTimelineColumn);
        worksheet.SheetView.FreezeRows(LastHeaderRow);
        worksheet.SheetView.FreezeColumns(FirstTimelineColumn - 1);

        worksheet.Column(1).Width = 10;
        worksheet.Column(2).Width = 36;
        worksheet.Column(3).Width = 13;
        worksheet.Column(4).Width = 13;
        worksheet.Column(5).Width = 8;
        worksheet.Column(6).Width = 10;
        for (var column = FirstTimelineColumn; column <= lastColumn; column++)
        {
            worksheet.Column(column).Width = 4.8;
        }

        worksheet.Range(FirstHeaderRow, 1, lastRow, lastColumn).Style.Border.InsideBorder = XLBorderStyleValues.Hair;
        worksheet.Range(FirstHeaderRow, 1, lastRow, lastColumn).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        worksheet.Range(FirstDataRow, FirstTimelineColumn, lastRow, lastColumn).Style.Border.InsideBorder = XLBorderStyleValues.None;
        worksheet.Range(FirstDataRow, FirstTimelineColumn, lastRow, lastColumn).Style.Border.OutsideBorder = XLBorderStyleValues.None;
        worksheet.Range(FirstDataRow, 2, lastRow, 2).Style.Alignment.WrapText = true;
        worksheet.Range(FirstDataRow, 1, lastRow, lastColumn).Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        worksheet.PageSetup.PageOrientation = XLPageOrientation.Landscape;
        worksheet.PageSetup.FitToPages(1, 0);
        worksheet.PageSetup.SetRowsToRepeatAtTop(FirstHeaderRow, LastHeaderRow);
        worksheet.PageSetup.PrintAreas.Add(1, 1, lastRow, lastColumn);
    }

    private static void ApplyTitleStyle(IXLCell cell)
    {
        cell.Style.Font.Bold = true;
        cell.Style.Font.FontSize = 16;
        cell.Style.Font.FontColor = XLColor.White;
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        cell.Style.Fill.BackgroundColor = GanttExcelTheme.TitleFill;
    }

    private static void ApplyMetadataLabelStyle(IXLCell cell)
    {
        cell.Style.Font.Bold = true;
        cell.Style.Font.FontColor = GanttExcelTheme.LabelText;
        cell.Style.Fill.BackgroundColor = GanttExcelTheme.MetadataFill;
        cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
    }

    private static void ApplyMetadataValueStyle(IXLRange range)
    {
        range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        range.Style.Alignment.WrapText = true;
    }

    private static void ApplyMainHeaderStyle(IXLRange range)
    {
        range.Style.Font.Bold = true;
        range.Style.Font.FontColor = XLColor.White;
        range.Style.Fill.BackgroundColor = GanttExcelTheme.HeaderFill;
        range.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        range.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
    }

    private static void ApplyTimelineHeaderStyle(IXLRange range, bool isWeekend)
    {
        range.Style.Font.Bold = true;
        range.Style.Font.FontSize = 9;
        range.Style.Fill.BackgroundColor = isWeekend ? GanttExcelTheme.WeekendHeaderFill : GanttExcelTheme.TimelineHeaderFill;
        range.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        range.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
    }

    private static void ApplyTimelineGroupHeaderStyle(IXLRange range)
    {
        range.Style.Font.Bold = true;
        range.Style.Font.FontSize = 9;
        range.Style.Fill.BackgroundColor = GanttExcelTheme.TimelineGroupHeaderFill;
        range.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        range.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        range.Style.Alignment.WrapText = true;
        range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
    }

    private static string BuildTimelineGroupHeader(ProjectTimelinePeriod start, ProjectTimelinePeriod end)
    {
        return start.Start == end.End
            ? $"{start.Header}\n{start.Start:dd/MM}"
            : $"{start.Header}\n{start.Start:dd/MM} - {end.End:dd/MM}";
    }

    private static string GetVietnameseWeekday(DayOfWeek day)
    {
        return day switch
        {
            DayOfWeek.Monday => "T2",
            DayOfWeek.Tuesday => "T3",
            DayOfWeek.Wednesday => "T4",
            DayOfWeek.Thursday => "T5",
            DayOfWeek.Friday => "T6",
            DayOfWeek.Saturday => "T7",
            DayOfWeek.Sunday => "CN",
            _ => string.Empty
        };
    }

    private static void ApplyRowBaseStyle(IXLRange range, ProjectTimelineRowDto row)
    {
        if (row.IsGroup)
        {
            range.Style.Font.Bold = true;
            range.Style.Fill.BackgroundColor = GanttExcelTheme.GroupFill;
            range.Style.Border.TopBorder = XLBorderStyleValues.Thin;
            range.Style.Border.BottomBorder = XLBorderStyleValues.Thin;
        }
    }

    private static void SetDateCell(IXLCell cell, DateOnly? value)
    {
        if (!value.HasValue)
        {
            cell.Value = string.Empty;
            return;
        }

        cell.Value = value.Value.ToDateTime(TimeOnly.MinValue);
        cell.Style.DateFormat.Format = "dd/MM/yyyy";
    }

    private static int CalendarDays(DateOnly? start, DateOnly? end)
    {
        return start.HasValue && end.HasValue && end.Value >= start.Value
            ? end.Value.DayNumber - start.Value.DayNumber + 1
            : 0;
    }

    private static void RenderMissingTimelineLabel(IXLWorksheet worksheet, int rowIndex, int periodCount, string label)
    {
        if (periodCount <= 0)
        {
            return;
        }

        var endColumn = FirstTimelineColumn + Math.Min(MissingTimelineLabelColumns, periodCount) - 1;
        var range = worksheet.Range(rowIndex, FirstTimelineColumn, rowIndex, endColumn);
        range.Merge();
        range.Value = label;
        range.Style.Font.Italic = true;
        range.Style.Font.FontSize = 9;
        range.Style.Font.FontColor = GanttExcelTheme.MissingText;
        range.Style.Fill.BackgroundColor = GanttExcelTheme.MissingFill;
        range.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
    }
}

internal static class GanttExcelTheme
{
    public static readonly XLColor TitleFill = XLColor.FromHtml("#1F4E78");
    public static readonly XLColor HeaderFill = XLColor.FromHtml("#385723");
    public static readonly XLColor TimelineGroupHeaderFill = XLColor.FromHtml("#BDD7EE");
    public static readonly XLColor TimelineHeaderFill = XLColor.FromHtml("#D9EAF7");
    public static readonly XLColor WeekendHeaderFill = XLColor.FromHtml("#E7E6E6");
    public static readonly XLColor MetadataFill = XLColor.FromHtml("#EAF2F8");
    public static readonly XLColor LabelText = XLColor.FromHtml("#1F4E78");
    public static readonly XLColor GroupFill = XLColor.FromHtml("#D9E2F3");
    public static readonly XLColor WeekendFill = XLColor.FromHtml("#F2F2F2");
    public static readonly XLColor PlannedFill = XLColor.FromHtml("#9DC3E6");
    public static readonly XLColor CompletedFill = XLColor.FromHtml("#2F75B5");
    public static readonly XLColor ActualFill = XLColor.FromHtml("#70AD47");
    public static readonly XLColor OverdueFill = XLColor.FromHtml("#C00000");
    public static readonly XLColor MilestoneFill = XLColor.FromHtml("#7030A0");
    public static readonly XLColor DeadlineFill = XLColor.FromHtml("#ED7D31");
    public static readonly XLColor MissingFill = XLColor.FromHtml("#F8FAFC");
    public static readonly XLColor MissingText = XLColor.FromHtml("#64748B");
}
