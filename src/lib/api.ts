// src/lib/api.ts
// HTTP client for the ISTA-GOMA backend API.
// Base URL is read from VITE_API_URL (defaults to /api for same-origin proxying).

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api"

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

// ApiEnvelope is the shape of every response from the Go backend.
interface ApiEnvelope<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const token = localStorage.getItem("ista-token")
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  if (!res.ok) {
    let errorBody: unknown
    try {
      errorBody = await res.json()
    } catch {
      errorBody = await res.text()
    }
    throw new ApiError(res.status, `HTTP ${res.status} ${res.statusText}`, errorBody)
  }

  if (res.status === 204) return undefined as T

  // Auto-unwrap the Go response envelope { success, data, ... }
  const envelope = await res.json() as ApiEnvelope<T>
  if (envelope.data !== undefined) return envelope.data
  return envelope as unknown as T
}

export const api = {
  get:    <T>(path: string, signal?: AbortSignal)         => request<T>("GET",    path, undefined, signal),
  post:   <T>(path: string, body: unknown)                => request<T>("POST",   path, body),
  put:    <T>(path: string, body: unknown)                => request<T>("PUT",    path, body),
  patch:  <T>(path: string, body: unknown)                => request<T>("PATCH",  path, body),
  delete: <T>(path: string)                               => request<T>("DELETE", path),
}

export { ApiError }

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginPayload   { email: string; password: string }
export interface LoginResponse  { token: string; user: import("@/types").User }
export interface MeResponse     { user: import("@/types").User }

export const authApi = {
  login:         (payload: LoginPayload)         => api.post<LoginResponse>("/v1/auth/login", payload),
  me:            ()                              => api.get<MeResponse>("/v1/auth/me"),
  logout:        ()                              => api.post<void>("/v1/auth/logout", {}),
  forgotPassword:(email: string)                 => api.post<void>("/v1/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post<void>("/v1/auth/reset-password", { token, password }),
  activateAccount:(token: string, password: string) =>
    api.post<LoginResponse>("/v1/auth/activate", { token, password }),
}

// ─── Academic entities ────────────────────────────────────────────────────────

export const facultyApi = {
  list:   ()               => api.get<import("@/types").Faculty[]>("/v1/faculties"),
  get:    (id: string)     => api.get<import("@/types").Faculty>(`/v1/faculties/${id}`),
  create: (body: unknown)  => api.post<import("@/types").Faculty>("/v1/faculties", body),
  update: (id: string, b: unknown) => api.put<import("@/types").Faculty>(`/v1/faculties/${id}`, b),
  delete: (id: string)     => api.delete<void>(`/v1/faculties/${id}`),
}

export const promotionApi = {
  list:   (facultyId?: string) =>
    api.get<import("@/types").Promotion[]>(facultyId ? `/v1/promotions?facultyId=${facultyId}` : "/v1/promotions"),
  get:    (id: string)         => api.get<import("@/types").Promotion>(`/v1/promotions/${id}`),
  create: (body: unknown)      => api.post<import("@/types").Promotion>("/v1/promotions", body),
  update: (id: string, b: unknown) => api.put<import("@/types").Promotion>(`/v1/promotions/${id}`, b),
  delete: (id: string)         => api.delete<void>(`/v1/promotions/${id}`),
}

export const courseApi = {
  list:   (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return api.get<import("@/types").Course[]>(`/v1/courses${qs}`)
  },
  get:    (id: string)         => api.get<import("@/types").Course>(`/v1/courses/${id}`),
  create: (body: unknown)      => api.post<import("@/types").Course>("/v1/courses", body),
  update: (id: string, b: unknown) => api.put<import("@/types").Course>(`/v1/courses/${id}`, b),
  delete: (id: string)         => api.delete<void>(`/v1/courses/${id}`),
  assignTeacher: (courseId: string, teacherId: string) =>
    api.patch<import("@/types").Course>(`/v1/courses/${courseId}/teacher`, { teacherId }),
}

export const scheduleApi = {
  list:   (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return api.get<import("@/types").ScheduleSlot[]>(`/v1/schedules${qs}`)
  },
  create: (body: unknown) => api.post<import("@/types").ScheduleSlot>("/v1/schedules", body),
  delete: (id: string)    => api.delete<void>(`/v1/schedules/${id}`),
}

export const roomApi = {
  list:   ()              => api.get<import("@/types").Room[]>("/v1/rooms"),
  create: (body: unknown) => api.post<import("@/types").Room>("/v1/rooms", body),
  delete: (id: string)    => api.delete<void>(`/v1/rooms/${id}`),
}

// ─── Students ─────────────────────────────────────────────────────────────────

export const studentApi = {
  list:   (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return api.get<import("@/types").Student[]>(`/v1/students${qs}`)
  },
  get:    (id: string)         => api.get<import("@/types").Student>(`/v1/students/${id}`),
  create: (body: unknown)      => api.post<import("@/types").Student>("/v1/students", body),
  update: (id: string, b: unknown) => api.put<import("@/types").Student>(`/v1/students/${id}`, b),
  updateStatus: (id: string, status: string) =>
    api.patch<import("@/types").Student>(`/v1/students/${id}/status`, { status }),
}

// ─── Teachers ─────────────────────────────────────────────────────────────────

export const teacherApi = {
  list:   (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return api.get<import("@/types").Teacher[]>(`/v1/teachers${qs}`)
  },
  get:    (id: string)         => api.get<import("@/types").Teacher>(`/v1/teachers/${id}`),
  create: (body: unknown)      => api.post<import("@/types").Teacher>("/v1/teachers", body),
  update: (id: string, b: unknown) => api.put<import("@/types").Teacher>(`/v1/teachers/${id}`, b),
  titles: ()                   => api.get<string[]>("/v1/teachers/titles"),
}

// ─── Grades ───────────────────────────────────────────────────────────────────

export const gradeApi = {
  list:   (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return api.get<import("@/types").Grade[]>(`/v1/grades${qs}`)
  },
  upsert: (body: unknown)       => api.post<import("@/types").Grade>("/v1/grades", body),
  updateStatus: (id: string, status: string) =>
    api.patch<import("@/types").Grade>(`/v1/grades/${id}/status`, { status }),
}

export const appealApi = {
  list:   (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return api.get<import("@/types").GradeAppeal[]>(`/v1/appeals${qs}`)
  },
  create: (body: unknown)      => api.post<import("@/types").GradeAppeal>("/v1/appeals", body),
  resolve:(id: string, status: "approved" | "rejected", response: string) =>
    api.patch<import("@/types").GradeAppeal>(`/v1/appeals/${id}/resolve`, { status, response }),
}

// ─── Assignments & Submissions ────────────────────────────────────────────────

export const assignmentApi = {
  list:   (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return api.get<import("@/types").Assignment[]>(`/v1/assignments${qs}`)
  },
  create: (body: unknown) => api.post<import("@/types").Assignment>("/v1/assignments", body),
  delete: (id: string)    => api.delete<void>(`/v1/assignments/${id}`),
}

export const submissionApi = {
  list:   (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return api.get<import("@/types").Submission[]>(`/v1/submissions${qs}`)
  },
  create: (body: unknown) => api.post<import("@/types").Submission>("/v1/submissions", body),
  grade:  (id: string, grade: number, feedback: string) =>
    api.patch<import("@/types").Submission>(`/v1/submissions/${id}/grade`, { grade, feedback }),
}

export const resourceApi = {
  list:   (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return api.get<import("@/types").CourseResource[]>(`/v1/resources${qs}`)
  },
  create: (body: unknown) => api.post<import("@/types").CourseResource>("/v1/resources", body),
  delete: (id: string)    => api.delete<void>(`/v1/resources/${id}`),
}

// ─── Announcements & Notifications ───────────────────────────────────────────

export const announcementApi = {
  list:   (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return api.get<import("@/types").Announcement[]>(`/v1/announcements${qs}`)
  },
  create: (body: unknown) => api.post<import("@/types").Announcement>("/v1/announcements", body),
}

export const notificationApi = {
  list:       ()          => api.get<import("@/types").Notification[]>("/v1/notifications"),
  markRead:   (id: string)=> api.patch<void>(`/v1/notifications/${id}/read`, {}),
  markAllRead:()          => api.patch<void>("/v1/notifications/read-all", {}),
}
