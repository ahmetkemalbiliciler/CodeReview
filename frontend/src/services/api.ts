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
    skipAuth?: boolean;
}

// Try to refresh the access token using refresh token
async function tryRefreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        const data = await response.json();
        if (data.success && data.data.access_token) {
            localStorage.setItem("token", data.data.access_token);
            localStorage.setItem("refresh_token", data.data.refresh_token);
            if (data.data.expires_at) {
                localStorage.setItem("token_expires_at", String(data.data.expires_at));
            }
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

// Check if token is expired or about to expire (within 60 seconds)
function isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem("token_expires_at");
    if (!expiresAt) return false;
    const expiryTime = parseInt(expiresAt) * 1000; // Convert to ms
    return Date.now() > expiryTime - 60000; // Refresh 60s before expiry
}

export async function apiCall<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    let token = localStorage.getItem("token");

    // Auto-refresh if token is expired
    if (token && !options.skipAuth && isTokenExpired()) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
            token = localStorage.getItem("token");
        }
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token && !options.skipAuth) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    // If unauthorized, try to refresh and retry once
    if (response.status === 401 && !options.skipAuth) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
            // Retry the request with new token
            const newToken = localStorage.getItem("token");
            headers["Authorization"] = `Bearer ${newToken}`;
            
            const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers,
            });
            const retryData = await retryResponse.json();
            
            if (!retryData.success) {
                throw new ApiError(retryData.error || "An unknown error occurred", retryResponse.status);
            }
            return retryData.data;
        } else {
            // Refresh failed, clear tokens and redirect to login
            localStorage.removeItem("token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("token_expires_at");
            localStorage.removeItem("user");
            window.location.href = "/login";
            throw new ApiError("Session expired. Please login again.", 401);
        }
    }

    if (!data.success) {
        throw new ApiError(data.error || "An unknown error occurred", response.status);
    }

    return data.data;
}

export const auth = {
    login: async (credentials: any) => {
        const data = await apiCall<any>("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
            skipAuth: true,
        });
        // Store tokens
        if (data.access_token) localStorage.setItem("token", data.access_token);
        if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
        if (data.expires_at) localStorage.setItem("token_expires_at", String(data.expires_at));
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        return data;
    },
    register: (credentials: any) => apiCall<any>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(credentials),
        skipAuth: true,
    }),
    forgotPassword: (data: { email: string }) => apiCall<any>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
        skipAuth: true,
    }),
    resetPassword: (password: string, token: string) => apiCall<any>("/auth/reset-password", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: password }),
        skipAuth: true,
    }),
    me: () => apiCall<any>("/auth/me"),
    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("token_expires_at");
        localStorage.removeItem("user");
        window.location.href = "/login";
    },
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
    list: (projectId: string) => apiCall<any[]>(`/comparisons/project/${projectId}`),
    get: (id: string) => apiCall<any>(`/comparisons/${id}`),
    explain: (id: string) => apiCall<any>(`/comparisons/${id}/explain`, { method: "POST" }),
};

export const stats = {
    getOverview: () => apiCall<{
        totalProjects: number;
        totalVersions: number;
        totalIssues: number;
        totalComparisons: number;
        issueBreakdown: {
            improved: number;
            worsened: number;
            unchanged: number;
        };
    }>("/stats"),
    getTrends: () => apiCall<{
        trends: Array<{ date: string; issues: number }>;
    }>("/stats/trends"),
    getTopIssues: (limit?: number) => apiCall<{
        topIssues: Array<{ issueCode: string; count: number }>;
    }>(`/stats/issues${limit ? `?limit=${limit}` : ""}`),
    getActivity: (limit?: number) => apiCall<{
        activities: Array<{
            type: "analysis" | "comparison";
            projectName: string;
            versionLabel?: string;
            issueCount?: number;
            resultCount?: number;
            createdAt: string;
        }>;
    }>(`/stats/activity${limit ? `?limit=${limit}` : ""}`),
};
