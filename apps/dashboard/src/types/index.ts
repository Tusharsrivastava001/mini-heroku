export interface User {
  id: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  branch: string;
  commitHash: string | null;
  commitMessage: string | null;
  status: 'QUEUED' | 'BUILDING' | 'DEPLOYING' | 'LIVE' | 'FAILED' | 'ROLLED_BACK';
  imageTag: string | null;
  liveUrl: string | null;
  errorMessage: string | null;
  rollbackOfId: string | null;
  buildStartedAt: string | null;
  buildFinishedAt: string | null;
  deployedAt: string | null;
  createdAt: string;
  updatedAt: string;
  rollbackOf?: {
    id: string;
    commitHash: string | null;
    commitMessage: string | null;
  };
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  isSecret: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  repoUrl: string;
  branch: string;
  rootDirectory: string;
  buildCommand: string | null;
  runCommand: string | null;
  port: number;
  customDomain: string | null;
  replicasMin: number;
  replicasMax: number;
  targetCpuPercent: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  deployments?: Deployment[];
  envVars?: EnvironmentVariable[];
  _count?: {
    deployments: number;
  };
}

export interface BuildLogLine {
  id?: string;
  deploymentId: string;
  lineNumber: number;
  message: string;
  stream: 'stdout' | 'stderr' | 'system';
  timestamp: string;
}

export interface ProjectMetricPoint {
  timestamp: string;
  time: string;
  cpuPercent: number;
  memoryMb: number;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: 'Hobby' | 'Pro' | 'Enterprise';
  clusterRegion: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}
