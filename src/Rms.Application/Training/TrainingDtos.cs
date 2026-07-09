using System.ComponentModel.DataAnnotations;
using Rms.Application.Common;

namespace Rms.Application.Training;

public sealed class TrainingEventQuery : PaginationQuery
{
    public int? Year { get; set; }
    public int? Month { get; set; }
    public long? CategoryId { get; set; }
    public string? PlanType { get; set; }
    public long? DepartmentId { get; set; }
    public long? ResponsibleUserId { get; set; }
    public string? EventStatus { get; set; }
    public string? DeliveryMode { get; set; }
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
}

public sealed record TrainingEventDto(
    long EventId,
    string EventCode,
    string EventTitle,
    string? Description,
    int EventYear,
    int EventMonth,
    DateOnly? PlannedDate,
    TimeOnly? StartTime,
    TimeOnly? EndTime,
    DateOnly? ActualDate,
    long? CategoryId,
    string? CategoryName,
    string EventType,
    string PlanType,
    long? DepartmentId,
    string? DepartmentName,
    long? ResponsibleUserId,
    string? ResponsibleUserName,
    string? Location,
    string DeliveryMode,
    int? ExpectedParticipants,
    int? ActualParticipants,
    string EventStatus,
    string? CancelReason,
    string? Notes);

public sealed record TrainingEventRequest(
    [Required] string EventCode,
    [Required] string EventTitle,
    string? Description,
    int EventYear,
    int EventMonth,
    DateOnly? PlannedDate,
    TimeOnly? StartTime,
    TimeOnly? EndTime,
    DateOnly? ActualDate,
    long? CategoryId,
    string? EventType,
    string? PlanType,
    long? DepartmentId,
    long? ResponsibleUserId,
    string? Location,
    string? DeliveryMode,
    int? ExpectedParticipants,
    int? ActualParticipants,
    string? EventStatus,
    string? CancelReason,
    string? Notes);

public sealed record TrainingCategoryDto(long CategoryId, string CategoryCode, string CategoryName, string? Description, string? ColorClass, int SortOrder, bool IsActive);
public sealed record TrainingCategoryRequest([Required] string CategoryCode, [Required] string CategoryName, string? Description, string? ColorClass, int SortOrder, bool IsActive);

public sealed record CalendarEventDto(long EventId, string EventCode, string EventTitle, DateOnly? PlannedDate, TimeOnly? StartTime, TimeOnly? EndTime, string? CategoryName, string PlanType, string EventStatus, string? Location);
public sealed record WeekCalendarDto(DateOnly StartDate, DateOnly EndDate, IReadOnlyList<WeekCalendarDayDto> Days);
public sealed record WeekCalendarDayDto(DateOnly Date, string DayName, bool IsToday, IReadOnlyList<CalendarEventDto> Events);
public sealed record MonthCalendarDto(int Year, int Month, string MonthName, IReadOnlyList<MonthCalendarWeekDto> Weeks);
public sealed record MonthCalendarWeekDto(IReadOnlyList<MonthCalendarDayDto> Days);
public sealed record MonthCalendarDayDto(DateOnly Date, int DayOfMonth, bool IsCurrentMonth, bool IsToday, IReadOnlyList<CalendarEventDto> Events);
public sealed record ScheduleDto(DateOnly FromDate, DateOnly ToDate, IReadOnlyList<ScheduleGroupDto> Groups);
public sealed record ScheduleGroupDto(DateOnly Date, string DateLabel, IReadOnlyList<CalendarEventDto> Events);

public sealed record TrainingStatisticsDto(
    int Year,
    int TotalPlanned,
    int TotalAdditional,
    int TotalActual,
    int TotalNotCompleted,
    decimal CompletionRate,
    int? PeakMonth,
    IReadOnlyList<TrainingMonthlySummaryDto> MonthlySummary);

public sealed record TrainingMonthlySummaryDto(int Month, string MonthName, int PlannedCount, int AdditionalCount, int TotalPlan, int ActualCount, int NotCompletedCount, decimal CompletionRate, IReadOnlyList<CalendarEventDto>? TopEvents = null);
