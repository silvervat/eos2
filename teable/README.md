# Teable Standalone Deployment

This is a standalone deployment of Teable using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- Ports 3000 and 42345 available on your system

## Setup

1. **Review and update the `.env` file** with your desired configuration:
   - Update `POSTGRES_PASSWORD` with a secure password
   - Update `REDIS_PASSWORD` with a secure password
   - Adjust `TIMEZONE` if needed (default: Europe/Tallinn)
   - Modify `PUBLIC_ORIGIN` if accessing from a different URL

2. **Start the services:**
   ```bash
   docker compose up -d
   ```

3. **Check the status:**
   ```bash
   docker compose ps
   ```

4. **View logs:**
   ```bash
   docker compose logs -f teable
   ```

## Access

- **Teable Application:** http://127.0.0.1:3000
- **PostgreSQL Database:** localhost:42345
  - Database: teable
  - User: teable (or as configured in .env)
  - Password: As configured in .env

## Services

This deployment includes:
- **teable**: The main Teable application (port 3000)
- **teable-db**: PostgreSQL 15.4 database (port 42345)
- **teable-cache**: Redis 7.2.4 cache (internal only)

## Data Persistence

Data is stored in Docker volumes:
- `teable-data`: Application assets
- `teable-db`: PostgreSQL data
- `teable-cache`: Redis data

To use bind-mounted directories instead, uncomment the relevant lines in `docker-compose.yaml`.

## Stopping and Removing

```bash
# Stop services
docker compose stop

# Stop and remove containers
docker compose down

# Stop, remove containers and volumes (⚠️ deletes all data)
docker compose down -v
```

## Troubleshooting

- **Services not starting:** Check logs with `docker compose logs`
- **Port conflicts:** Ensure ports 3000 and 42345 are not in use
- **Database connection issues:** Verify environment variables in `.env`

## More Information

- Official Teable repository: https://github.com/teableio/teable
- Teable documentation: https://help.teable.ai
- Teable website: https://teable.ai
