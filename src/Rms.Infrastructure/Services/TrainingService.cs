using Microsoft.EntityFrameworkCore;
using Rms.Application.Admin;
using Rms.Application.Common;
using Rms.Application.Training;
using Rms.Infrastructure.Persistence;
using Rms.Infrastructure.Persistence.Entities;

namespace Rms.Infrastructure.Services;

public sealed class TrainingService : ITrainingService
{
    private readonly RmsDbContext _dbContext;
    private readonly IAuditService _auditService;
    private readonly IUserContext _userContext;

    public TrainingService(RmsDbContext dbContext, IAuditService auditService, IUserContext userContext)
    {
        _dbContext = dbContext;
        _auditService = auditService;
        _userContext = userContext;
    }

    public async Task<PagedResult<TrainingEventDto>> GetEventsAsync(TrainingEventQuery query, CancellationToken cancellationToken = default)
    {
        var events = EventGraph().Where(x => x.DeletedAt == null && x.IsActive);
        events = ApplyEventFilters(events, query);

        var total = await events.CountAsync(cancellationToken);
        var items = await events.OrderBy(x => x.PlannedDate ?? DateOnly.MaxValue)
            .ThenBy(x => x.StartTime)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return PagedResult<TrainingEventDto>.Create(items.Select(MapEvent).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<TrainingEventDto> GetEventAsync(long id, CancellationToken cancellationToken = default)
    {
        var item = await EventGraph().FirstOrDefaultAsync(x => x.EventId == id && x.DeletedAt == null, cancellationToken);
        return item is null ? throw new NotFoundException("Training event not found.") : MapEvent(item);
    }

    public async Task<TrainingEventDto> CreateEventAsync(TrainingEventRequest request, CancellationToken cancellationToken = default)
    {
        ValidateEvent(request);
        if (await _dbContext.TrainingEvents.AnyAsync(x => x.EventCode == request.EventCode.Trim() && x.DeletedAt == null, cancellationToken))
        {
            throw new InvalidOperationException("Training event code already exists.");
        }

        var item = new TrainingEvent
        {
            EventCode = request.EventCode.Trim(),
            EventTitle = request.EventTitle.Trim(),
            EventDescription = request.Description,
            EventYear = request.EventYear,
            EventMonth = request.EventMonth,
            PlannedDate = request.PlannedDate,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            ActualDate = request.ActualDate,
            CategoryId = request.CategoryId,
            EventType = Default(request.EventType, "other"),
            PlanType = Default(request.PlanType, "planned"),
            DepartmentId = request.DepartmentId,
            ResponsibleUserId = request.ResponsibleUserId,
            Location = request.Location,
            DeliveryMode = Default(request.DeliveryMode, "offline"),
            PlannedAttendees = request.ExpectedParticipants,
            ActualAttendees = request.ActualParticipants,
            EventStatus = Default(request.EventStatus, "planned"),
            CancellationReason = request.CancelReason,
            Notes = request.Notes,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _userContext.User?.UserId
        };

        _dbContext.TrainingEvents.Add(item);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await WriteTrainingLogAsync(item.EventId, "created", request.Notes, cancellationToken);
        await _auditService.WriteActivityAsync("training_event", "create", $"Created training event {item.EventCode}", "TrainingEvent", item.EventId, item.EventCode, cancellationToken: cancellationToken);
        return await GetEventAsync(item.EventId, cancellationToken);
    }

    public async Task<TrainingEventDto> UpdateEventAsync(long id, TrainingEventRequest request, CancellationToken cancellationToken = default)
    {
        ValidateEvent(request);
        var item = await _dbContext.TrainingEvents.FirstOrDefaultAsync(x => x.EventId == id && x.DeletedAt == null, cancellationToken);
        if (item is null) throw new NotFoundException("Training event not found.");
        if (await _dbContext.TrainingEvents.AnyAsync(x => x.EventId != id && x.EventCode == request.EventCode.Trim() && x.DeletedAt == null, cancellationToken))
        {
            throw new InvalidOperationException("Training event code already exists.");
        }

        item.EventCode = request.EventCode.Trim();
        item.EventTitle = request.EventTitle.Trim();
        item.EventDescription = request.Description;
        item.EventYear = request.EventYear;
        item.EventMonth = request.EventMonth;
        item.PlannedDate = request.PlannedDate;
        item.StartTime = request.StartTime;
        item.EndTime = request.EndTime;
        item.ActualDate = request.ActualDate;
        item.CategoryId = request.CategoryId;
        item.EventType = Default(request.EventType, "other");
        item.PlanType = Default(request.PlanType, "planned");
        item.DepartmentId = request.DepartmentId;
        item.ResponsibleUserId = request.ResponsibleUserId;
        item.Location = request.Location;
        item.DeliveryMode = Default(request.DeliveryMode, "offline");
        item.PlannedAttendees = request.ExpectedParticipants;
        item.ActualAttendees = request.ActualParticipants;
        item.EventStatus = Default(request.EventStatus, "planned");
        item.CancellationReason = request.CancelReason;
        item.Notes = request.Notes;
        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedBy = _userContext.User?.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
        await WriteTrainingLogAsync(item.EventId, "updated", request.Notes, cancellationToken);
        await _auditService.WriteActivityAsync("training_event", "update", $"Updated training event {item.EventCode}", "TrainingEvent", item.EventId, item.EventCode, cancellationToken: cancellationToken);
        return await GetEventAsync(item.EventId, cancellationToken);
    }

    public async Task DeleteEventAsync(long id, CancellationToken cancellationToken = default)
    {
        var item = await _dbContext.TrainingEvents.FirstOrDefaultAsync(x => x.EventId == id && x.DeletedAt == null, cancellationToken);
        if (item is null) throw new NotFoundException("Training event not found.");
        item.DeletedAt = DateTime.UtcNow;
        item.DeletedBy = _userContext.User?.UserId;
        item.IsActive = false;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await WriteTrainingLogAsync(item.EventId, "deleted", null, cancellationToken);
        await _auditService.WriteActivityAsync("training_event", "delete", $"Deleted training event {item.EventCode}", "TrainingEvent", item.EventId, item.EventCode, cancellationToken: cancellationToken);
    }

    public async Task<WeekCalendarDto> GetWeekAsync(DateOnly date, CancellationToken cancellationToken = default)
    {
        var offset = ((int)date.DayOfWeek + 6) % 7;
        var start = date.AddDays(-offset);
        var end = start.AddDays(6);
        var grouped = await LoadCalendarEventsAsync(start, end, cancellationToken);
        var days = Enumerable.Range(0, 7)
            .Select(i =>
            {
                var day = start.AddDays(i);
                return new WeekCalendarDayDto(day, DayName(day), IsToday(day), EventsFor(grouped, day));
            })
            .ToList();
        return new WeekCalendarDto(start, end, days);
    }

    public async Task<MonthCalendarDto> GetMonthAsync(int year, int month, CancellationToken cancellationToken = default)
    {
        ValidateMonth(year, month);
        var first = new DateOnly(year, month, 1);
        var gridStart = first.AddDays(-(((int)first.DayOfWeek + 6) % 7));
        var gridEnd = gridStart.AddDays(41);
        var grouped = await LoadCalendarEventsAsync(gridStart, gridEnd, cancellationToken);
        var weeks = Enumerable.Range(0, 6)
            .Select(w => new MonthCalendarWeekDto(Enumerable.Range(0, 7).Select(d =>
            {
                var day = gridStart.AddDays(w * 7 + d);
                return new MonthCalendarDayDto(day, day.Day, day.Month == month, IsToday(day), EventsFor(grouped, day));
            }).ToList()))
            .ToList();
        return new MonthCalendarDto(year, month, MonthName(month), weeks);
    }

    public async Task<IReadOnlyList<TrainingMonthlySummaryDto>> GetYearAsync(int year, CancellationToken cancellationToken = default)
    {
        var events = await EventGraph()
            .Where(x => x.DeletedAt == null && x.IsActive && x.EventYear == year)
            .ToListAsync(cancellationToken);
        return BuildMonthlySummary(year, events, includeTopEvents: true);
    }

    public async Task<ScheduleDto> GetScheduleAsync(DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default)
    {
        if (fromDate > toDate) throw new InvalidOperationException("fromDate must be before or equal to toDate.");
        var grouped = await LoadCalendarEventsAsync(fromDate, toDate, cancellationToken);
        var groups = grouped.OrderBy(x => x.Key)
            .Select(x => new ScheduleGroupDto(x.Key, $"{DayName(x.Key)}, {x.Key:dd/MM/yyyy}", x.Value))
            .ToList();
        return new ScheduleDto(fromDate, toDate, groups);
    }

    public async Task<TrainingStatisticsDto> GetYearlyStatisticsAsync(int year, CancellationToken cancellationToken = default)
    {
        var events = await EventGraph()
            .Where(x => x.DeletedAt == null && x.IsActive && x.EventYear == year)
            .ToListAsync(cancellationToken);
        var monthly = BuildMonthlySummary(year, events, includeTopEvents: false);
        var totalPlanned = monthly.Sum(x => x.PlannedCount);
        var totalAdditional = monthly.Sum(x => x.AdditionalCount);
        var totalActual = monthly.Sum(x => x.ActualCount);
        var totalPlan = totalPlanned + totalAdditional;
        var totalNotCompleted = monthly.Sum(x => x.NotCompletedCount);
        var peak = monthly.OrderByDescending(x => x.TotalPlan).ThenByDescending(x => x.ActualCount).FirstOrDefault(x => x.TotalPlan > 0)?.Month;
        var rate = totalPlan == 0 ? 0 : Math.Round(totalActual / (decimal)totalPlan * 100, 2);
        return new TrainingStatisticsDto(year, totalPlanned, totalAdditional, totalActual, totalNotCompleted, rate, peak, monthly);
    }

    public async Task<IReadOnlyList<TrainingCategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default)
    {
        var categories = await _dbContext.EventCategories.OrderBy(x => x.SortOrder).ThenBy(x => x.CategoryName).ToListAsync(cancellationToken);
        return categories.Select(MapCategory).ToList();
    }

    public async Task<TrainingCategoryDto> GetCategoryAsync(long id, CancellationToken cancellationToken = default)
    {
        var category = await _dbContext.EventCategories.FirstOrDefaultAsync(x => x.CategoryId == id, cancellationToken);
        return category is null ? throw new NotFoundException("Training category not found.") : MapCategory(category);
    }

    public async Task<TrainingCategoryDto> CreateCategoryAsync(TrainingCategoryRequest request, CancellationToken cancellationToken = default)
    {
        if (await _dbContext.EventCategories.AnyAsync(x => x.CategoryCode == request.CategoryCode.Trim(), cancellationToken))
        {
            throw new InvalidOperationException("Training category code already exists.");
        }

        var category = new EventCategory
        {
            CategoryCode = request.CategoryCode.Trim(),
            CategoryName = request.CategoryName.Trim(),
            Description = request.Description,
            ColorClass = request.ColorClass,
            SortOrder = request.SortOrder,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.EventCategories.Add(category);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("training_event", "create_category", $"Created training category {category.CategoryCode}", "EventCategory", category.CategoryId, category.CategoryCode, cancellationToken: cancellationToken);
        return MapCategory(category);
    }

    public async Task<TrainingCategoryDto> UpdateCategoryAsync(long id, TrainingCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var category = await _dbContext.EventCategories.FirstOrDefaultAsync(x => x.CategoryId == id, cancellationToken);
        if (category is null) throw new NotFoundException("Training category not found.");
        if (await _dbContext.EventCategories.AnyAsync(x => x.CategoryId != id && x.CategoryCode == request.CategoryCode.Trim(), cancellationToken))
        {
            throw new InvalidOperationException("Training category code already exists.");
        }

        category.CategoryCode = request.CategoryCode.Trim();
        category.CategoryName = request.CategoryName.Trim();
        category.Description = request.Description;
        category.ColorClass = request.ColorClass;
        category.SortOrder = request.SortOrder;
        category.IsActive = request.IsActive;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("training_event", "update_category", $"Updated training category {category.CategoryCode}", "EventCategory", category.CategoryId, category.CategoryCode, cancellationToken: cancellationToken);
        return MapCategory(category);
    }

    public async Task DeleteCategoryAsync(long id, CancellationToken cancellationToken = default)
    {
        var category = await _dbContext.EventCategories.FirstOrDefaultAsync(x => x.CategoryId == id, cancellationToken);
        if (category is null) throw new NotFoundException("Training category not found.");
        category.IsActive = false;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("training_event", "delete_category", $"Disabled training category {category.CategoryCode}", "EventCategory", category.CategoryId, category.CategoryCode, cancellationToken: cancellationToken);
    }

    private IQueryable<TrainingEvent> EventGraph() => _dbContext.TrainingEvents
        .Include(x => x.Category)
        .Include(x => x.Department)
        .Include(x => x.ResponsibleUser);

    private static IQueryable<TrainingEvent> ApplyEventFilters(IQueryable<TrainingEvent> events, TrainingEventQuery query)
    {
        if (!string.IsNullOrWhiteSpace(query.Search)) events = events.Where(x => x.EventCode.Contains(query.Search) || x.EventTitle.Contains(query.Search));
        if (query.Year is not null) events = events.Where(x => x.EventYear == query.Year);
        if (query.Month is not null) events = events.Where(x => x.EventMonth == query.Month);
        if (query.CategoryId is not null) events = events.Where(x => x.CategoryId == query.CategoryId);
        if (!string.IsNullOrWhiteSpace(query.PlanType)) events = events.Where(x => x.PlanType == query.PlanType);
        if (query.DepartmentId is not null) events = events.Where(x => x.DepartmentId == query.DepartmentId);
        if (query.ResponsibleUserId is not null) events = events.Where(x => x.ResponsibleUserId == query.ResponsibleUserId);
        if (!string.IsNullOrWhiteSpace(query.EventStatus)) events = events.Where(x => x.EventStatus == query.EventStatus);
        if (!string.IsNullOrWhiteSpace(query.DeliveryMode)) events = events.Where(x => x.DeliveryMode == query.DeliveryMode);
        if (query.FromDate is not null) events = events.Where(x => x.PlannedDate >= query.FromDate);
        if (query.ToDate is not null) events = events.Where(x => x.PlannedDate <= query.ToDate);
        return events;
    }

    private async Task<Dictionary<DateOnly, IReadOnlyList<CalendarEventDto>>> LoadCalendarEventsAsync(DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken)
    {
        var items = await EventGraph()
            .Where(x => x.DeletedAt == null && x.IsActive && x.PlannedDate >= fromDate && x.PlannedDate <= toDate)
            .OrderBy(x => x.PlannedDate).ThenBy(x => x.StartTime)
            .ToListAsync(cancellationToken);
        return items.Where(x => x.PlannedDate is not null)
            .GroupBy(x => x.PlannedDate!.Value)
            .ToDictionary(x => x.Key, x => (IReadOnlyList<CalendarEventDto>)x.Select(MapCalendarEvent).ToList());
    }

    private static IReadOnlyList<TrainingMonthlySummaryDto> BuildMonthlySummary(int year, IReadOnlyList<TrainingEvent> events, bool includeTopEvents)
    {
        return Enumerable.Range(1, 12).Select(month =>
        {
            var monthly = events.Where(x => x.EventYear == year && x.EventMonth == month).ToList();
            var planned = monthly.Count(x => x.PlanType == "planned");
            var additional = monthly.Count(x => x.PlanType == "additional");
            var actual = monthly.Count(x => x.EventStatus == "completed");
            var total = planned + additional;
            var notCompleted = Math.Max(total - actual, 0);
            var rate = total == 0 ? 0 : Math.Round(actual / (decimal)total * 100, 2);
            var top = includeTopEvents
                ? monthly.OrderBy(x => x.PlannedDate ?? DateOnly.MaxValue).Take(3).Select(MapCalendarEvent).ToList()
                : null;
            return new TrainingMonthlySummaryDto(month, MonthName(month), planned, additional, total, actual, notCompleted, rate, top);
        }).ToList();
    }

    private static TrainingEventDto MapEvent(TrainingEvent item) => new(
        item.EventId,
        item.EventCode,
        item.EventTitle,
        item.EventDescription,
        item.EventYear,
        item.EventMonth,
        item.PlannedDate,
        item.StartTime,
        item.EndTime,
        item.ActualDate,
        item.CategoryId,
        item.Category?.CategoryName,
        item.EventType,
        item.PlanType,
        item.DepartmentId,
        item.Department?.DepartmentName,
        item.ResponsibleUserId,
        item.ResponsibleUser?.FullName,
        item.Location,
        item.DeliveryMode,
        item.PlannedAttendees,
        item.ActualAttendees,
        item.EventStatus,
        item.CancellationReason,
        item.Notes);

    private static CalendarEventDto MapCalendarEvent(TrainingEvent item) => new(item.EventId, item.EventCode, item.EventTitle, item.PlannedDate, item.StartTime, item.EndTime, item.Category?.CategoryName, item.PlanType, item.EventStatus, item.Location);
    private static TrainingCategoryDto MapCategory(EventCategory item) => new(item.CategoryId, item.CategoryCode, item.CategoryName, item.Description, item.ColorClass, item.SortOrder, item.IsActive);
    private static IReadOnlyList<CalendarEventDto> EventsFor(IReadOnlyDictionary<DateOnly, IReadOnlyList<CalendarEventDto>> grouped, DateOnly date) => grouped.TryGetValue(date, out var events) ? events : Array.Empty<CalendarEventDto>();
    private static bool IsToday(DateOnly date) => date == DateOnly.FromDateTime(DateTime.UtcNow);
    private static string MonthName(int month) => $"Tháng {month}";
    private static string DayName(DateOnly date) => date.DayOfWeek switch { DayOfWeek.Monday => "Thứ Hai", DayOfWeek.Tuesday => "Thứ Ba", DayOfWeek.Wednesday => "Thứ Tư", DayOfWeek.Thursday => "Thứ Năm", DayOfWeek.Friday => "Thứ Sáu", DayOfWeek.Saturday => "Thứ Bảy", _ => "Chủ Nhật" };
    private static string Default(string? value, string fallback) => string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    private static void ValidateEvent(TrainingEventRequest request)
    {
        ValidateMonth(request.EventYear, request.EventMonth);
        if (request.PlannedDate is not null && (request.PlannedDate.Value.Year != request.EventYear || request.PlannedDate.Value.Month != request.EventMonth))
        {
            throw new InvalidOperationException("eventYear and eventMonth must match plannedDate.");
        }

        if (request.StartTime is not null && request.EndTime is not null && request.EndTime <= request.StartTime)
        {
            throw new InvalidOperationException("endTime must be after startTime.");
        }

        if (request.ExpectedParticipants is < 0 || request.ActualParticipants is < 0)
        {
            throw new InvalidOperationException("Participant counts must be greater than or equal to 0.");
        }
    }

    private static void ValidateMonth(int year, int month)
    {
        if (year is < 2000 or > 2100) throw new InvalidOperationException("eventYear must be between 2000 and 2100.");
        if (month is < 1 or > 12) throw new InvalidOperationException("eventMonth must be between 1 and 12.");
    }

    private async Task WriteTrainingLogAsync(long eventId, string actionType, string? note, CancellationToken cancellationToken)
    {
        _dbContext.TrainingEventLogs.Add(new TrainingEventLog
        {
            EventId = eventId,
            ActionType = actionType,
            Note = note,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _userContext.User?.UserId
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
