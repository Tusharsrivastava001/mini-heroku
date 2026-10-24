// Mock @kubernetes/client-node before importing deployer
jest.mock('@kubernetes/client-node', () => {
  return {
    KubeConfig: jest.fn().mockImplementation(() => ({
      loadFromFile: jest.fn(),
      loadFromCluster: jest.fn(),
      loadFromDefault: jest.fn(),
      makeApiClient: jest.fn().mockReturnValue({
        readNamespace: jest.fn().mockResolvedValue({ body: {} }),
        createNamespace: jest.fn().mockResolvedValue({ body: {} }),
        createNamespacedResourceQuota: jest.fn().mockResolvedValue({ body: {} }),
        createNamespacedLimitRange: jest.fn().mockResolvedValue({ body: {} }),
        createNamespacedNetworkPolicy: jest.fn().mockResolvedValue({ body: {} }),
        createNamespacedSecret: jest.fn().mockResolvedValue({ body: {} }),
        createNamespacedDeployment: jest.fn().mockResolvedValue({ body: {} }),
        createNamespacedService: jest.fn().mockResolvedValue({ body: {} }),
        createNamespacedIngress: jest.fn().mockResolvedValue({ body: {} }),
        createNamespacedHorizontalPodAutoscaler: jest.fn().mockResolvedValue({ body: {} }),
        readNamespacedDeploymentStatus: jest.fn().mockResolvedValue({
          body: {
            status: { availableReplicas: 1, readyReplicas: 1 },
            spec: { replicas: 1 },
          },
        }),
        deleteNamespacedDeployment: jest.fn().mockResolvedValue({ body: {} }),
        deleteNamespacedService: jest.fn().mockResolvedValue({ body: {} }),
        deleteNamespacedIngress: jest.fn().mockResolvedValue({ body: {} }),
        deleteNamespacedSecret: jest.fn().mockResolvedValue({ body: {} }),
        deleteNamespacedHorizontalPodAutoscaler: jest.fn().mockResolvedValue({ body: {} }),
      }),
    })),
    CoreV1Api: jest.fn(),
    AppsV1Api: jest.fn(),
    NetworkingV1Api: jest.fn(),
    AutoscalingV2Api: jest.fn(),
  };
});

import { KubernetesDeployer } from '../src/deployer/k8s.js';

describe('Kubernetes Deployer Engine', () => {
  let deployer: KubernetesDeployer;

  beforeEach(() => {
    deployer = new KubernetesDeployer();
  });

  it('should instantiate KubernetesDeployer cleanly', () => {
    expect(deployer).toBeDefined();
    expect(typeof deployer.deploy).toBe('function');
    expect(typeof deployer.ensureNamespace).toBe('function');
    expect(typeof deployer.applyResourceQuota).toBe('function');
    expect(typeof deployer.applyLimitRange).toBe('function');
    expect(typeof deployer.applyNetworkPolicy).toBe('function');
    expect(typeof deployer.applyDeployment).toBe('function');
    expect(typeof deployer.applyHPA).toBe('function');
  });

  it('should successfully execute deployment lifecycle', async () => {
    const logs: string[] = [];
    const mockEmitLog = async (msg: string) => {
      logs.push(msg);
    };

    const liveUrl = await deployer.deploy(
      {
        namespace: 'df-sample-app',
        slug: 'sample-app',
        imageTag: 'localhost:5001/sample-app:test-tag',
        port: 3000,
        envVars: { NODE_ENV: 'production' },
      },
      mockEmitLog
    );

    expect(liveUrl).toContain('sample-app');
    expect(logs.some((l) => l.includes('Provisioning isolated namespace'))).toBe(true);
    expect(logs.some((l) => l.includes('Configuring Ingress'))).toBe(true);
    expect(logs.some((l) => l.includes('Application is live'))).toBe(true);
  });
});
