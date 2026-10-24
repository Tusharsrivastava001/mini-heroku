import fs from 'fs';
import path from 'path';
import os from 'os';
import { detectProject } from '../src/builder/detector.js';

describe('Buildpack Runtime Detector', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deployforge-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it('should detect existing Dockerfile', () => {
    fs.writeFileSync(path.join(tempDir, 'Dockerfile'), 'FROM alpine:latest\nCMD ["echo", "hello"]');
    const result = detectProject(tempDir);

    expect(result.hasDockerfile).toBe(true);
    expect(result.projectType).toBe('dockerfile');
    expect(result.generatedDockerfile).toBeUndefined();
  });

  it('should detect Node.js package.json and synthesize Dockerfile', () => {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'my-app', scripts: { start: 'node server.js' } })
    );

    const result = detectProject(tempDir, 8080);

    expect(result.hasDockerfile).toBe(false);
    expect(result.projectType).toBe('nodejs');
    expect(result.generatedDockerfile).toBeDefined();
    expect(result.generatedDockerfile).toContain('FROM node:20-alpine');
    expect(result.generatedDockerfile).toContain('ENV PORT=8080');
    expect(result.generatedDockerfile).toContain('USER nodeuser');
  });

  it('should detect Python requirements.txt and synthesize Dockerfile', () => {
    fs.writeFileSync(path.join(tempDir, 'requirements.txt'), 'flask==3.0.0\ngunicorn==21.2.0');

    const result = detectProject(tempDir, 5000);

    expect(result.hasDockerfile).toBe(false);
    expect(result.projectType).toBe('python');
    expect(result.generatedDockerfile).toBeDefined();
    expect(result.generatedDockerfile).toContain('FROM python:3.11-slim');
    expect(result.generatedDockerfile).toContain('ENV PORT=5000');
    expect(result.generatedDockerfile).toContain('USER pyuser');
  });

  it('should detect Go go.mod and synthesize multi-stage Dockerfile', () => {
    fs.writeFileSync(path.join(tempDir, 'go.mod'), 'module example.com/app\ngo 1.22');

    const result = detectProject(tempDir, 8080);

    expect(result.hasDockerfile).toBe(false);
    expect(result.projectType).toBe('golang');
    expect(result.generatedDockerfile).toBeDefined();
    expect(result.generatedDockerfile).toContain('FROM golang:1.22-alpine AS builder');
    expect(result.generatedDockerfile).toContain('USER gouser');
  });

  it('should detect static HTML index.html and synthesize Nginx Dockerfile', () => {
    fs.writeFileSync(path.join(tempDir, 'index.html'), '<h1>Hello DeployForge</h1>');

    const result = detectProject(tempDir);

    expect(result.hasDockerfile).toBe(false);
    expect(result.projectType).toBe('static');
    expect(result.generatedDockerfile).toBeDefined();
    expect(result.generatedDockerfile).toContain('FROM nginx:alpine');
  });
});
