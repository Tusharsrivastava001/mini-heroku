import { Project, Deployment, User, BuildLogLine, ProjectMetricPoint } from '../types/index.js';

const API_BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('deployforge_token');
}

export function setToken(token: string) {
  localStorage.setItem('deployforge_token', token);
}

export function clearToken() {
  localStorage.removeItem('deployforge_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Auth
  devLogin: async (username?: string): Promise<{ token: string; user: User }> => {
    const data = await request<{ token: string; user: User }>('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ username: username || 'dev-engineer' }),
    });
    setToken(data.token);
    return data;
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    return request<{ user: User }>('/auth/me');
  },

  logout: async (): Promise<void> => {
    await request('/auth/logout', { method: 'POST' }).catch(() => {});
    clearToken();
  },

  // Projects
  listProjects: async (): Promise<{ projects: Project[] }> => {
    return request<{ projects: Project[] }>('/projects');
  },

  getProject: async (id: string): Promise<{ project: Project }> => {
    return request<{ project: Project }>(`/projects/${id}`);
  },

  createProject: async (data: Omit<Partial<Project>, 'envVars'> & { envVars?: Record<string, string> }): Promise<{ project: Project }> => {
    return request<{ project: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<{ project: Project }> => {
    return request<{ project: Project }>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteProject: async (id: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  // Environment Variables
  setEnvVar: async (projectId: string, key: string, value: string, isSecret = true) => {
    return request(`/projects/${projectId}/env`, {
      method: 'PUT',
      body: JSON.stringify({ key, value, isSecret }),
    });
  },

  deleteEnvVar: async (projectId: string, key: string) => {
    return request(`/projects/${projectId}/env/${key}`, {
      method: 'DELETE',
    });
  },

  // Deployments
  triggerDeploy: async (projectId: string, options?: { branch?: string; commitMessage?: string }): Promise<{ deployment: Deployment }> => {
    return request<{ deployment: Deployment }>(`/projects/${projectId}/deploy`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  },

  listDeployments: async (projectId: string): Promise<{ deployments: Deployment[] }> => {
    return request<{ deployments: Deployment[] }>(`/projects/${projectId}/deployments`);
  },

  getDeployment: async (id: string): Promise<{ deployment: Deployment }> => {
    return request<{ deployment: Deployment }>(`/deployments/${id}`);
  },

  triggerRollback: async (deploymentId: string): Promise<{ deployment: Deployment }> => {
    return request<{ deployment: Deployment }>(`/deployments/${deploymentId}/rollback`, {
      method: 'POST',
    });
  },

  getDeploymentLogs: async (deploymentId: string): Promise<{ logs: BuildLogLine[] }> => {
    return request<{ logs: BuildLogLine[] }>(`/deployments/${deploymentId}/logs`);
  },

  getProjectMetrics: async (projectId: string): Promise<{ metrics: ProjectMetricPoint[] }> => {
    return request<{ metrics: ProjectMetricPoint[] }>(`/projects/${projectId}/metrics`);
  },
};
