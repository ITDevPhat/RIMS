import { apiClient, type PagedResult, type QueryParams } from "./api-client";

export interface ApiTrainingEvent {
  eventId: number;
  eventCode: string;
  eventTitle: string;
  description?: string | null;
  eventYear: number;
  eventMonth: number;
  plannedDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  actualDate?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  eventType: string;
  planType: string;
  departmentId?: number | null;
  departmentName?: string | null;
  responsibleUserId?: number | null;
  responsibleUserName?: string | null;
  location?: string | null;
  deliveryMode: string;
  expectedParticipants?: number | null;
  actualParticipants?: number | null;
  eventStatus: string;
  cancelReason?: string | null;
  notes?: string | null;
}

export interface ApiTrainingCategory {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  description?: string | null;
  colorClass?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export const trainingApi = {
  getTrainingEvents: (filters?: QueryParams) => apiClient.get<PagedResult<ApiTrainingEvent>>("/training-events", filters),
  getTrainingEvent: (id: string | number) => apiClient.get<ApiTrainingEvent>(`/training-events/${id}`),
  createTrainingEvent: (payload: unknown) => apiClient.post<ApiTrainingEvent>("/training-events", payload),
  updateTrainingEvent: (id: string | number, payload: unknown) => apiClient.put<ApiTrainingEvent>(`/training-events/${id}`, payload),
  deleteTrainingEvent: (id: string | number) => apiClient.delete<null>(`/training-events/${id}`),
  getCalendarWeek: (date: string) => apiClient.get<unknown>("/training-calendar/week", { date }),
  getCalendarMonth: (year: number, month: number) => apiClient.get<unknown>("/training-calendar/month", { year, month }),
  getCalendarYear: (year: number) => apiClient.get<unknown>("/training-calendar/year", { year }),
  getCalendarSchedule: (fromDate: string, toDate: string) =>
    apiClient.get<unknown>("/training-calendar/schedule", { fromDate, toDate }),
  getTrainingYearlyStatistics: (year: number) => apiClient.get<unknown>("/training-statistics/yearly", { year }),
  getTrainingCategories: () => apiClient.get<ApiTrainingCategory[]>("/training-categories"),
};
