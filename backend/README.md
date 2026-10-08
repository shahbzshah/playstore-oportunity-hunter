# Backend — Opportunity Hunter API (Laravel)

REST API for the Play Store Opportunity Hunter. Handles auth, keyword scan
jobs, opportunity storage, and AI analysis. Heavy lifting (scraping, scoring,
AI) is delegated to the Python FastAPI service.

## Requirements

- PHP 8.2+
- Composer
- The Python service running (`../python-service`, default `http://127.0.0.1:8000`)

## Setup

```bash
composer install
cp .env.example .env          # then set PYTHON_SERVICE_URL if needed
php artisan key:generate
php artisan migrate
php artisan serve --port=8001  # API at http://127.0.0.1:8001/api/v1
```

Database: SQLite by default (`database/database.sqlite`). For MySQL, update
`DB_*` in `.env` — no code changes needed.

## Queue worker

Scans run as queued jobs. Process them with:

```bash
php artisan queue:work
```

## Scheduler

An example daily scan is commented out in `routes/console.php`. Enable the
scheduler cron to use it:

```
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

Manual scan via CLI:

```bash
php artisan scan:run "habit tracker" --email=you@example.com
```

## API

Base: `/api/v1` — all routes except register/login require a Sanctum bearer token.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create account, returns token |
| POST | `/login` | Login, returns token |
| GET | `/me` | Current user |
| POST | `/logout` | Revoke current token |
| POST | `/scans` | Queue a keyword scan → `202` |
| GET | `/scans` | List your scans |
| GET | `/scans/{id}` | Scan status + result count |
| GET | `/opportunities` | Ranked opportunities (`?bookmarked=1`, `?search=`) |
| POST | `/opportunities` | Save an opportunity manually |
| GET | `/opportunities/{id}` | Opportunity + its analyses |
| PATCH | `/opportunities/{id}` | Update (bookmark, summary) |
| DELETE | `/opportunities/{id}` | Delete |
| POST | `/analyze/{appId}` | AI analysis via Python service, persisted |

## Tests

```bash
php artisan test
```
