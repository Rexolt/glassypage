# Glassypage — convenience targets (Docker Compose)
# Usage: make up | make down | make logs | make rebuild | make update
COMPOSE := docker compose

.PHONY: help up down restart logs ps build rebuild pull update shell prune env config

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

env: ## Create .env from .env.example if missing
	@test -f .env || (cp .env.example .env && echo "Created .env — review it.")

config: ## Seed config.json from config.example.json if missing
	@test -f config.json || (cp config.example.json config.json && echo "Created config.json from config.example.json")

up: env config ## Build (if needed) and start in the background
	$(COMPOSE) up -d --build

down: ## Stop and remove the container
	$(COMPOSE) down

restart: ## Restart the container
	$(COMPOSE) restart

logs: ## Follow container logs
	$(COMPOSE) logs -f --tail=100

ps: ## Show container status
	$(COMPOSE) ps

build: ## Build the image
	$(COMPOSE) build

rebuild: ## Rebuild from scratch (no cache) and restart
	$(COMPOSE) build --no-cache && $(COMPOSE) up -d

update: ## Pull latest code, rebuild and restart
	git pull --ff-only && $(COMPOSE) up -d --build

shell: ## Open a shell in the running container
	$(COMPOSE) exec glassypage sh

prune: ## Remove dangling images/build cache
	docker image prune -f
