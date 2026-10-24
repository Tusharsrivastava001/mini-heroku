.PHONY: help up down dev build test lint typecheck clean k8s-local smoke-test

SHELL := /bin/bash
COMPOSE := docker compose

help: ## Display this help message
	@echo "DeployForge - Developer Platform Control Interface"
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

up: ## Start the full local stack (Postgres, Redis, Registry, API, Worker, Dashboard)
	$(COMPOSE) up -d --build
	@echo "DeployForge is launching!"
	@echo "  Dashboard: http://localhost:3000"
	@echo "  API:       http://localhost:4000"
	@echo "  Registry:  http://localhost:5001"

down: ## Stop all local services and clean up containers
	$(COMPOSE) down -v

dev: ## Start backend services in Docker and run frontend/API locally
	$(COMPOSE) up -d postgres redis registry
	npm run dev

build: ## Build all workspaces
	npm run build

test: ## Run unit and integration tests across all workspaces
	npm run test

lint: ## Run linters across all workspaces
	npm run lint

typecheck: ## Run TypeScript type checks across all workspaces
	npm run typecheck

smoke-test: ## Execute end-to-end smoke test against the running platform
	npm run --prefix apps/api test:smoke

clean: ## Clean node_modules, build caches, and test artifacts
	rm -rf node_modules apps/*/node_modules apps/*/dist
