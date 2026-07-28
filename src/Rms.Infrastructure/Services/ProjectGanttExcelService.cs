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
        RestoreTimelineBarBorders(worksheet, periods.Count, lastRow);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void BuildMetadata(IXLWorksheet worksheet, ProjectTimelineDto timeline, int periodCount)
    {
        var lastColumn = Math.Max(FirstTimelineColumn + periodCount - 1, FirstTimelineColumn);
        var informationTitle = worksheet.Range(1, 1, 1, 6);
        informationTitle.Merge().Value = "THÔNG TIN DỰ ÁN";
        ApplyTitleStyle(informationTitle.FirstCell());
        var reportTitle = worksheet.Range(1, FirstTimelineColumn, 1, lastColumn);
        reportTitle.Merge().Value = "BÁO CÁO TIẾN ĐỘ DỰ ÁN";
        ApplyTitleStyle(reportTitle.FirstCell());

        SetMetadata(worksheet, 2, 1, "Mã đề tài", timeline.ProjectCode, valueEndColumn: 6);
        SetMetadata(worksheet, 3, 1, "Tên đề tài", timeline.ProjectTitle, valueEndColumn: 6);
        worksheet.Range(3, 2, 3, 6).Style.Font.Bold = true;
        SetMetadata(worksheet, 4, 1, "Chủ nhiệm", timeline.ProjectLeadName, valueEndColumn: 2);
        SetMetadata(worksheet, 4, 3, "Khoa/Phòng", timeline.DepartmentName, valueEndColumn: 6);
        SetMetadata(worksheet, 5, 1, "Thời gian dự kiến", FormatDateRange(timeline.PlannedStartDate, timeline.PlannedEndDate), valueEndColumn: 2);
        SetMetadata(worksheet, 5, 3, "Nhà tài trợ", timeline.SponsorName, valueEndColumn: 6);
        SetMetadata(worksheet, 6, 1, "Thời gian thực tế", FormatDateRange(timeline.ActualStartDate, timeline.ActualEndDate), valueEndColumn: 2);
        SetMetadata(worksheet, 6, 3, "Trạng thái", TranslateStatus(timeline.Status), valueEndColumn: 6);
    }

    private static string FormatDateRange(DateOnly? start, DateOnly? end) =>
        $"{(start.HasValue ? start.Value.ToString("dd/MM/yyyy") : "Chưa có")} - {(end.HasValue ? end.Value.ToString("dd/MM/yyyy") : "Chưa có")}";

    internal static string TranslateStatus(string? status) => status?.Trim().ToLowerInvariant() switch
    {
        "completed" or "complete" or "done" => "Hoàn thành",
        "in_progress" or "in progress" or "ongoing" => "Đang thực hiện",
        "not_started" or "not started" or "pending" => "Chưa bắt đầu",
        "delayed" or "overdue" => "Trễ tiến độ",
        "on_hold" or "on hold" => "Tạm dừng",
        "cancelled" or "canceled" => "Đã hủy",
        null or "" => "Chưa xác định",
        _ => status
    };

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
        var renderedRows = new List<(ProjectTimelineRowDto Row, int StartRow, int EndRow)>();
        foreach (var row in timeline.Rows)
        {
            var startRow = rowIndex;
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

            renderedRows.Add((row, startRow, rowIndex));
            rowIndex++;
        }

        MergeGroupDurationCells(worksheet, renderedRows);

        return Math.Max(rowIndex - 1, FirstDataRow);
    }

    private static void MergeGroupDurationCells(
        IXLWorksheet worksheet,
        IReadOnlyList<(ProjectTimelineRowDto Row, int StartRow, int EndRow)> renderedRows)
    {
        for (var index = 0; index < renderedRows.Count; index++)
        {
            var current = renderedRows[index];
            // The project summary contains all phases, so merging it would overlap phase merges.
            if (!current.Row.IsGroup || current.Row.HierarchyLevel == 0)
            {
                continue;
            }

            var endRow = current.EndRow;
            for (var childIndex = index + 1; childIndex < renderedRows.Count; childIndex++)
            {
                if (renderedRows[childIndex].Row.HierarchyLevel <= current.Row.HierarchyLevel)
                {
                    break;
                }

                endRow = renderedRows[childIndex].EndRow;
            }

            if (endRow <= current.StartRow)
            {
                continue;
            }

            var duration = worksheet.Cell(current.StartRow, 5).Value;
            var range = worksheet.Range(current.StartRow, 5, endRow, 5);
            range.Merge();
            range.FirstCell().Value = duration;
            range.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            range.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
        }
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
        var coveredPeriodIndexes = periods
            .Select((period, index) => (period, index))
            .Where(x => ProjectTimelineExportLogic.Overlaps(start.Value, safeEnd, x.period.Start, x.period.End))
            .Select(x => x.index)
            .ToList();
        if (coveredPeriodIndexes.Count == 0)
        {
            return;
        }

        var fill = IsWarning(row) ? GanttExcelTheme.WarningFill : GanttExcelTheme.OnTrackFill;
        foreach (var index in coveredPeriodIndexes)
        {
            var cell = worksheet.Cell(rowIndex, FirstTimelineColumn + index);
            cell.Style.Fill.BackgroundColor = fill;
        }

        var bar = worksheet.Range(
            rowIndex,
            FirstTimelineColumn + coveredPeriodIndexes[0],
            rowIndex,
            FirstTimelineColumn + coveredPeriodIndexes[^1]);
        bar.Style.Border.InsideBorder = XLBorderStyleValues.None;
        bar.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
    }

    private static bool IsWarning(ProjectTimelineRowDto row) =>
        row.IsOverdue
        || row.Status.Contains("delay", StringComparison.OrdinalIgnoreCase)
        || row.Status.Contains("warning", StringComparison.OrdinalIgnoreCase)
        || row.Status.Contains("overdue", StringComparison.OrdinalIgnoreCase)
        || row.RiskLevel.Equals("high", StringComparison.OrdinalIgnoreCase)
        || row.RiskLevel.Equals("critical", StringComparison.OrdinalIgnoreCase);

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
        cell.Style.Fill.BackgroundColor = IsWarning(row) ? GanttExcelTheme.WarningFill : GanttExcelTheme.OnTrackFill;
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

    private static void RestoreTimelineBarBorders(IXLWorksheet worksheet, int periodCount, int lastRow)
    {
        for (var row = FirstDataRow; row <= lastRow; row++)
        {
            var first = -1;
            var last = -1;
            for (var index = 0; index < periodCount; index++)
            {
                var color = worksheet.Cell(row, FirstTimelineColumn + index).Style.Fill.BackgroundColor;
                if (color == GanttExcelTheme.OnTrackFill || color == GanttExcelTheme.WarningFill)
                {
                    first = first < 0 ? index : first;
                    last = index;
                }
            }

            if (first < 0)
            {
                continue;
            }

            var bar = worksheet.Range(row, FirstTimelineColumn + first, row, FirstTimelineColumn + last);
            bar.Style.Border.InsideBorder = XLBorderStyleValues.None;
            bar.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        }
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
    public static readonly XLColor OnTrackFill = XLColor.FromHtml("#70AD47");
    public static readonly XLColor WarningFill = XLColor.FromHtml("#FFD966");
}
