/**
 * API Client for Backend Communication
 * All API calls should go through this client
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
}


async function request<T>(url: string, fetchOptions: RequestInit = {}): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not defined');
  }

  const isFormData = fetchOptions.body instanceof FormData;

  // Convert headers to Record<string, string>
  const headers: Record<string, string> = {};
  
  if (fetchOptions.headers) {
    if (fetchOptions.headers instanceof Headers) {
      // Convert Headers object to Record
      fetchOptions.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(fetchOptions.headers)) {
      // Convert array of [key, value] pairs to Record
      fetchOptions.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      // Already a Record<string, string>
      Object.assign(headers, fetchOptions.headers);
    }
  }

  // ⛔ Do NOT set Content-Type if sending FormData
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  // If JSON body, stringify it
  let body = fetchOptions.body;
  if (body && !isFormData && typeof body !== 'string') {
    body = JSON.stringify(body);
  }

  const response = await fetch(baseUrl + url, {
    ...fetchOptions,
    headers,
    body,
  });

  // Handle non-OK responses
  if (!response.ok) {
    const text = await response.text();

    let errorMessage = text;
    try {
      const errorData = JSON.parse(text);
      errorMessage = errorData.message || errorMessage;
    } catch (e) {}

    throw new Error(errorMessage || `HTTP Error: ${response.status}`);
  }

  // Try returning as JSON
  try {
    return response.json() as Promise<T>;
  } catch (err) {
    return {} as T;
  }
}

export { request };


// Exam API
export const examApi = {
  getAll: () => request<Exam[]>('/exams'),
  upload: (file: File, examName: string, userId: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('examName', examName);
    formData.append('userId', String(userId));

    return request<{ success: boolean; examId: number; questionCount: number }>(
      '/exams/upload',
      {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type with boundary for FormData
      }
    );
  },
};

// Quiz API
export const quizApi = {
  getQuestions: (examId: number) =>
    request<Question[]>(`/quizzes/${examId}/questions`),
  submit: (data: {
    examId: number;
    studentId: number;
    answers: Record<string, number>;
    durationSeconds: number;
  }) =>
    request<{
      success: boolean;
      score: number;
      correct: number;
      total: number;
    }>('/quizzes/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Analytics API
export const analyticsApi = {
  getDashboard: () => request<AnalyticsData>('/analytics/dashboard'),
  trackVisit: (userId: number | null, pageName: string) =>
    request<{ success: boolean }>('/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ userId, pageName }),
    }),
};

// User API
export const userApi = {
  getStudentCount: () => request<{ count: number }>('/users/count'),
  register: (data: { email: string; username: string; name: string; password: string; geographicalLocation?: string }) =>
    request<{ success: boolean; user: any }>('/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    async getCurrentUser() {
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      return response.json();
    },
};

// Types
export interface Exam {
  id: number;
  name: string;
  fileName: string;
  status: 'draft' | 'published' | 'processing';
  questionCount: number;
  createdAt: string;
}

export interface Question {
  id: number;
  questionText: string;
  questionNumber: number;
  difficulty: 'easy' | 'medium' | 'hard';
  options: Array<{
    id: number;
    text: string;
    number: number;
  }>;
}

export interface AnalyticsData {
  dailyVisits: Array<{
    date: string;
    uniqueVisitors: number;
    totalVisits: number;
  }>;
  enrollments: Array<{
    date: string;
    count: number;
  }>;
  purchases: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
  competition: {
    participants: number;
  };
  totalStudents: number;
  geographicalData?: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
}















