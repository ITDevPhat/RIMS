using Rms.Application.Common;

namespace Rms.Application.Training;

public interface ITrainingService
{
    Task<PagedResult<TrainingEventDto>> GetEventsAsync(TrainingEventQuery query, CancellationToken cancellationToken = default);
    Task<TrainingEventDto> GetEventAsync(long id, CancellationToken cancellationToken = default);
    Task<TrainingEventDto> CreateEventAsync(TrainingEventRequest request, CancellationToken cancellationToken = default);
    Task<TrainingEventDto> UpdateEventAsync(long id, TrainingEventRequest request, CancellationToken cancellationToken = default);
    Task DeleteEventAsync(long id, CancellationToken cancellationToken = default);

    Task<WeekCalendarDto> GetWeekAsync(DateOnly date, CancellationToken cancellationToken = default);
    Task<MonthCalendarDto> GetMonthAsync(int year, int month, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TrainingMonthlySummaryDto>> GetYearAsync(int year, CancellationToken cancellationToken = default);
    Task<ScheduleDto> GetScheduleAsync(DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default);
    Task<TrainingStatisticsDto> GetYearlyStatisticsAsync(int year, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TrainingCategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default);
    Task<TrainingCategoryDto> GetCategoryAsync(long id, CancellationToken cancellationToken = default);
    Task<TrainingCategoryDto> CreateCategoryAsync(TrainingCategoryRequest request, CancellationToken cancellationToken = default);
    Task<TrainingCategoryDto> UpdateCategoryAsync(long id, TrainingCategoryRequest request, CancellationToken cancellationToken = default);
    Task DeleteCategoryAsync(long id, CancellationToken cancellationToken = default);
}
