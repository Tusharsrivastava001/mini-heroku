#!/usr/bin/env node

/**
 * DeployForge End-to-End Smoke Test Suite
 * Validates health, metrics, auth, project lifecycle, encrypted env vars, deploy triggers, and teardown.
 */

const API_BASE = process.env.API_URL || 'http://localhost:4000/api';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
};

function logStep(step, message) {
  console.log(`${colors.cyan}[STEP ${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}  ✔ ${message}${colors.reset}`);
}

function logFail(message) {
  console.error(`${colors.red}  ✖ ${message}${colors.reset}`);
}

async function run() {
  console.log(`\n${colors.bold}====================================================`);
  console.log(`🚀 Starting DeployForge End-to-End Smoke Test Suite`);
  console.log(`Target: ${API_BASE}`);
  console.log(`====================================================${colors.reset}\n`);

  let token = '';
  let projectId = '';
  let deploymentId = '';

  try {
    // 1. Health Probe
    logStep(1, 'Verifying Platform Health Endpoint (/api/health)...');
    const healthRes = await fetch(`${API_BASE}/health`);
    if (!healthRes.ok) throw new Error(`Health check returned status ${healthRes.status}`);
    const health = await healthRes.json();
    logSuccess(`Platform reported status: ${health.status} (API: ${health.services.api})`);

    // 2. Metrics Endpoint
    logStep(2, 'Verifying Prometheus Metrics Endpoint (/api/metrics)...');
    const metricsRes = await fetch(`${API_BASE}/metrics`);
    if (!metricsRes.ok) throw new Error(`Metrics endpoint returned status ${metricsRes.status}`);
    const metricsText = await metricsRes.text();
    if (!metricsText.includes('deployforge_')) {
      throw new Error('Prometheus metrics missing deployforge_ metrics prefix');
    }
    logSuccess('Prometheus metrics scraped successfully');

    // 3. Dev Authentication
    logStep(3, 'Authenticating as test engineer via /api/auth/dev-login...');
    const authRes = await fetch(`${API_BASE}/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: `smoke-tester-${Date.now().toString(36)}` }),
    });
    if (!authRes.ok) throw new Error(`Auth failed with status ${authRes.status}`);
    const authData = await authRes.json();
    token = authData.token;
    logSuccess(`Authenticated user: ${authData.user.username} (Role: ${authData.user.role})`);

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 4. Create Project
    logStep(4, 'Creating new microservice project...');
    const testSlug = `smoke-app-${Date.now().toString(36)}`;
    const projRes = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Smoke Test Microservice',
        slug: testSlug,
        description: 'Automated CI/CD smoke test application',
        repoUrl: 'https://github.com/expressjs/express',
        branch: 'main',
        port: 3000,
        replicasMin: 1,
        replicasMax: 3,
        targetCpuPercent: 80,
      }),
    });
    if (!projRes.ok) {
      const err = await projRes.json();
      throw new Error(`Project creation failed: ${JSON.stringify(err)}`);
    }
    const projData = await projRes.json();
    projectId = projData.project.id;
    logSuccess(`Created project [${projData.project.name}] (Slug: ${projData.project.slug})`);

    // 5. Set Encrypted Environment Variable
    logStep(5, 'Configuring AES-256-GCM encrypted secret variable...');
    const envRes = await fetch(`${API_BASE}/projects/${projectId}/env`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        key: 'DATABASE_URL',
        value: 'postgres://user:super_secret_password_123@db:5432/main',
        isSecret: true,
      }),
    });
    if (!envRes.ok) throw new Error(`Env var creation failed: ${envRes.status}`);
    const envData = await envRes.json();
    logSuccess(`Saved encrypted environment variable: ${envData.envVar.key}`);

    // 6. Trigger Deployment
    logStep(6, 'Triggering container build and deployment...');
    const deployRes = await fetch(`${API_BASE}/projects/${projectId}/deploy`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        branch: 'main',
        commitMessage: 'Smoke test automated trigger',
      }),
    });
    if (!deployRes.ok) throw new Error(`Deployment trigger failed: ${deployRes.status}`);
    const deployData = await deployRes.json();
    deploymentId = deployData.deployment.id;
    logSuccess(`Deployment queued with ID: ${deploymentId} (Status: ${deployData.deployment.status})`);

    // 7. Inspect Deployment Status & Logs
    logStep(7, 'Querying deployment status and build logs...');
    const getDepRes = await fetch(`${API_BASE}/deployments/${deploymentId}`, {
      headers: authHeaders,
    });
    if (!getDepRes.ok) throw new Error(`Deployment lookup failed: ${getDepRes.status}`);
    const getDepData = await getDepRes.json();
    logSuccess(`Deployment query verified: status=${getDepData.deployment.status}, branch=${getDepData.deployment.branch}`);

    // 8. Query Timeseries Metrics
    logStep(8, 'Querying real-time observability metrics...');
    const metRes = await fetch(`${API_BASE}/projects/${projectId}/metrics`, {
      headers: authHeaders,
    });
    if (!metRes.ok) throw new Error(`Metrics lookup failed: ${metRes.status}`);
    const metData = await metRes.json();
    logSuccess(`Retrieved ${metData.metrics.length} metrics data points for dashboard visualization`);

    // 9. Teardown & Clean Up Project
    logStep(9, 'Cleaning up and deleting test project...');
    const delRes = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!delRes.ok) throw new Error(`Project delete failed: ${delRes.status}`);
    logSuccess('Project deleted successfully; K8s resources scheduled for cleanup');

    console.log(`\n${colors.green}${colors.bold}====================================================`);
    console.log(`🎉 ALL SMOKE TESTS PASSED SUCCESSFULLY!`);
    console.log(`====================================================${colors.reset}\n`);
    process.exit(0);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bold}====================================================`);
    console.error(`❌ SMOKE TEST FAILED: ${error.message}`);
    console.error(`====================================================${colors.reset}\n`);

    // Attempt cleanup if projectId exists
    if (projectId && token) {
      try {
        await fetch(`${API_BASE}/projects/${projectId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    process.exit(1);
  }
}

run();
