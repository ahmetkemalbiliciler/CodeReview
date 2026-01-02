const API_BASE = "http://localhost:3000/api";

export class ApiError extends Error {
    public message: string;
    public status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.message = message;
        this.status = status;
        this.name = "ApiError";
    }
}

interface ApiOptions extends RequestInit {
    headers?: Record<string, string>;
}

export async function apiCall<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const token = localStorage.getItem("token");

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!data.success) {
        throw new ApiError(data.error || "An unknown error occurred", response.status);
    }

    return data.data;
}

export const auth = {
    login: (credentials: any) => apiCall<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    }),
    register: (credentials: any) => apiCall<any>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(credentials),
    }),
    forgotPassword: (data: { email: string }) => apiCall<any>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    resetPassword: (password: string, token: string) => apiCall<any>("/auth/reset-password", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: password }),
    }),
    me: () => apiCall<any>("/auth/me"),
};

export const projects = {
    list: () => apiCall<any[]>("/projects"),
    create: (data: { name: string; description?: string }) => apiCall<any>("/projects", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    get: (id: string) => apiCall<any>(`/projects/${id}`),
    delete: (id: string) => apiCall<any>(`/projects/${id}`, { method: "DELETE" }),
};

export const versions = {
    create: (projectId: string, data: { versionLabel: string; sourceCode: string }) =>
        apiCall<any>(`/versions/project/${projectId}`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    list: (projectId: string) => apiCall<any[]>(`/versions/project/${projectId}`),
    get: (id: string) => apiCall<any>(`/versions/${id}`),
    delete: (id: string) => apiCall<any>(`/versions/${id}`, { method: "DELETE" }),
    update: (id: string, data: { versionLabel: string }) => apiCall<any>(`/versions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    }),
};

export const analyses = {
    reanalyze: (versionId: string, sourceCode: string) =>
        apiCall<any>(`/analyses/version/${versionId}`, {
            method: "POST",
            body: JSON.stringify({ sourceCode }),
        }),
    get: (versionId: string) => apiCall<any>(`/analyses/version/${versionId}`),
};

export const comparisons = {
    create: (projectId: string, data: { fromVersionId: string; toVersionId: string }) =>
        apiCall<any>(`/comparisons/project/${projectId}`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
    get: (id: string) => apiCall<any>(`/comparisons/${id}`),
    explain: (id: string) => apiCall<any>(`/comparisons/${id}/explain`, { method: "POST" }),
};
