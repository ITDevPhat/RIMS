using System.Text;

namespace Rms.Application.Reports;

public static class ProjectTimelineExportLogic
{
    private static readonly char[] InvalidFileNameChars = Path.GetInvalidFileNameChars();

    public static int CalculateWorkingDays(DateOnly? start, DateOnly? end)
    {
        if (!start.HasValue || !end.HasValue || end.Value < start.Value)
        {
            return 0;
        }

        var count = 0;
        for (var date = start.Value; date <= end.Value; date = date.AddDays(1))
        {
            if (date.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday)
            {
                count++;
            }
        }

        return count;
    }

    public static ProjectTimelineTimeScale ResolveTimeScale(
        ProjectTimelineTimeScale requestedScale,
        DateOnly start,
        DateOnly end)
    {
        if (requestedScale is not ProjectTimelineTimeScale.Auto)
        {
            return requestedScale;
        }

        var days = end.DayNumber - start.DayNumber + 1;
        return days <= 180
            ? ProjectTimelineTimeScale.Day
            : days <= 540
                ? ProjectTimelineTimeScale.Week
                : ProjectTimelineTimeScale.Month;
    }

    public static bool Overlaps(DateOnly itemStart, DateOnly itemEnd, DateOnly periodStart, DateOnly periodEnd)
    {
        return itemStart <= periodEnd && itemEnd >= periodStart;
    }

    public static IReadOnlyList<ProjectTimelinePeriod> BuildPeriods(DateOnly start, DateOnly end, ProjectTimelineTimeScale scale)
    {
        var periods = new List<ProjectTimelinePeriod>();
        if (end < start)
        {
            return periods;
        }

        if (scale == ProjectTimelineTimeScale.Day)
        {
            for (var date = start; date <= end; date = date.AddDays(1))
            {
                var weekNumber = ((date.DayNumber - start.DayNumber) / 7) + 1;

                periods.Add(new ProjectTimelinePeriod(
                    date,
                    date,
                    $"Week {weekNumber}",
                    date.ToString("dd/MM/yyyy"),
                    date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday));
            }

            return periods;
        }

        if (scale == ProjectTimelineTimeScale.Week)
        {
            var cursor = start;
            var weekNumber = 1;
            while (cursor <= end)
            {
                var periodEnd = Min(cursor.AddDays(6), end);
                periods.Add(new ProjectTimelinePeriod(
                    cursor,
                    periodEnd,
                    $"Week {weekNumber}",
                    $"{cursor:dd/MM/yyyy} - {periodEnd:dd/MM/yyyy}",
                    false));
                cursor = cursor.AddDays(7);
                weekNumber++;
            }

            return periods;
        }

        var monthCursor = new DateOnly(start.Year, start.Month, 1);
        while (monthCursor <= end)
        {
            var periodEnd = monthCursor.AddMonths(1).AddDays(-1);
            periods.Add(new ProjectTimelinePeriod(
                monthCursor,
                periodEnd,
                monthCursor.ToString("MM/yyyy"),
                monthCursor.ToString("MMM yyyy"),
                false));
            monthCursor = monthCursor.AddMonths(1);
        }

        return periods;
    }

    public static string SanitizeFileName(string value)
    {
        var builder = new StringBuilder(value.Length);
        foreach (var ch in value.Trim())
        {
            builder.Append(InvalidFileNameChars.Contains(ch) || char.IsControl(ch) ? '_' : ch);
        }

        var sanitized = builder.ToString().Trim(' ', '.', '_');
        return string.IsNullOrWhiteSpace(sanitized) ? "Project" : sanitized;
    }

    public static bool IsIncompleteStatus(string? status)
    {
        return !string.Equals(status, "completed", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(status, "complete", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(status, "done", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(status, "cancelled", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(status, "canceled", StringComparison.OrdinalIgnoreCase);
    }

    private static DateOnly Min(DateOnly first, DateOnly second)
    {
        return first <= second ? first : second;
    }
}
