// src/api.ts
import { QueryFunctionContext, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Helper to include auth token
function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useAuth() {
  const [token, setToken] = React.useState<string | null>(null);
  const login = async (username?: string) => {
    const resp = await fetch(`${API_BASE}/api/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (!resp.ok) throw new Error('Login failed');
    const data = await resp.json();
    setToken(data.token);
    return data;
  };
  return { token, login };
}

export function useProjects(token: string | null) {
  return useQuery(['projects'], async () => {
    const resp = await fetch(`${API_BASE}/api/projects`, {
      headers: { ...authHeaders(token) },
    });
    if (!resp.ok) throw new Error('Failed to fetch projects');
    return resp.json();
  }, { enabled: !!token });
}

export function useProject(token: string | null, projectId: string) {
  return useQuery(['project', projectId], async () => {
    const resp = await fetch(`${API_BASE}/api/projects/${projectId}`, {
      headers: { ...authHeaders(token) },
    });
    if (!resp.ok) throw new Error('Failed to fetch project');
    return resp.json();
  }, { enabled: !!token });
}

export function useDeploy(token: string | null, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation(async () => {
    const resp = await fetch(`${API_BASE}/api/projects/${projectId}/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    });
    if (!resp.ok) throw new Error('Deploy failed');
    return resp.json();
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries(['project', projectId]);
    },
  });
}

export function useDeployments(token: string | null, projectId: string) {
  return useQuery(['project', projectId, 'deployments'], async () => {
    const resp = await fetch(`${API_BASE}/api/projects/${projectId}/deployments`, {
      headers: { ...authHeaders(token) },
    });
    if (!resp.ok) throw new Error('Failed to fetch deployments');
    return resp.json();
  }, { enabled: !!token });
}

export function useRollback(token: string | null, projectId: string, deploymentId: string) {
  const queryClient = useQueryClient();
  return useMutation(async () => {
    const resp = await fetch(`${API_BASE}/api/projects/${projectId}/deployments/${deploymentId}/rollback`, {
      method: 'POST',
      headers: { ...authHeaders(token) },
    });
    if (!resp.ok) throw new Error('Rollback failed');
    return resp.json();
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries(['project', projectId]);
    },
  });
}

export function useEnvVars(token: string | null, projectId: string) {
  return useQuery(['project', projectId, 'env'], async () => {
    const resp = await fetch(`${API_BASE}/api/projects/${projectId}`, {
      headers: { ...authHeaders(token) },
    });
    if (!resp.ok) throw new Error('Failed to fetch env vars');
    const data = await resp.json();
    return data.envVars;
  }, { enabled: !!token });
}

export function useUpdateEnvVars(token: string | null, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation(async (envVars: Record<string, string>) => {
    const resp = await fetch(`${API_BASE}/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ envVars }),
    });
    if (!resp.ok) throw new Error('Failed to update env vars');
    return resp.json();
  }, {
    onSuccess: () => queryClient.invalidateQueries(['project', projectId, 'env']),
  });
}
