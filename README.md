# 🎯 Play Store Opportunity Hunter

<div align="center">

![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=flat&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=flat&logo=fastapi&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Status](https://img.shields.io/badge/Status-Active-success)

**An intelligent AI-powered platform that discovers hidden gem mobile apps on Google Play Store and analyzes market opportunities for building better versions.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Docs](#-api-documentation)

</div>

---

## 📖 About

**Play Store Opportunity Hunter** is a sophisticated full-stack application that automatically scrapes Google Play Store data, identifies underrated apps with high potential (high ratings + low downloads), and uses AI to provide actionable market analysis and improvement suggestions.

Perfect for entrepreneurs, developers, and product managers looking to discover untapped market opportunities and validate app ideas before investing in development.

### 🎯 Problem It Solves

- **Discover Hidden Gems**: Find high-quality apps that haven't reached their market potential
- **Market Validation**: Use AI to analyze competition, target markets, and revenue potential
- **Save Research Time**: Automate the tedious process of scanning and analyzing hundreds of apps
- **Data-Driven Decisions**: Make informed decisions about which apps to clone or improve upon

---

## ✨ Features

### 🔍 Smart Discovery Engine
- **Category-based Scanning**: Scan apps across all Play Store categories
- **Keyword Search**: Find apps by specific terms or niches
- **Multi-Criteria Filtering**: Filter by rating, downloads, category, and custom metrics
- **Real-time Progress Tracking**: Visual feedback during scanning operations

### 🤖 AI-Powered Analysis
- **Dual AI Provider Support**: Primary Mistral AI with OpenAI fallback
- **Intelligent Scoring**: Proprietary algorithm based on quality, market gap, and competition
- **Market Analysis**: AI-generated insights on target markets and revenue potential
- **Deep Research**: Web-enabled competitor analysis and trend identification
- **Improvement Plans**: Actionable suggestions for building better versions

### 📊 Opportunity Scoring System

```
Opportunity Score = (Quality × Gap × Market) / Competition

Quality Score (0-100): Rating, reviews, recency, description
Gap Multiplier (1-5): Downloads relative to quality
Market Potential (0-100): Category popularity, trends, monetization
Competition Factor (1-10): Market saturation level
```

### 🔄 Automation & Scheduling
- **Scheduled Scans**: Hourly, daily, or weekly automated scanning
- **Custom Categories/Keywords**: Define your target niches
- **Smart Notifications**: Get alerts when high-opportunity apps are discovered
- **Multi-Channel Support**: Email, Telegram, and Discord notifications

### 📱 Modern Dashboard
- **Interactive Visualizations**: Score gauges, progress bars, and charts
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark Mode Support**: Comfortable viewing in any lighting
- **Real-time Updates**: Live data refresh without page reloads

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript 5.0** | Type Safety |
| **Vite** | Build Tool |
| **Tailwind CSS** | Styling |
| **Shadcn/ui** | Component Library |
| **Framer Motion** | Animations |
| **Zustand** | State Management |
| **Axios** | HTTP Client |

### Backend (Laravel)
| Technology | Purpose |
|------------|---------|
| **Laravel 11** | PHP Framework |
| **MySQL 8.0+** | Database |
| **Laravel Sanctum** | API Authentication |
| **Laravel Queue** | Job Processing |
| **Laravel Scheduler** | Task Automation |
| **Laravel Notifications** | Multi-channel alerts |

### Python Service (FastAPI)
| Technology | Purpose |
|------------|---------|
| **FastAPI 0.104** | Python API Framework |
| **Uvicorn** | ASGI Server |
| **google-play-scraper** | Data Scraping |
| **OpenAI SDK** | AI Integration |
| **Mistral AI** | Primary AI Provider |

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Supervisor** - Process Management
- **Git** - Version Control

---

## 🚀 Quick Start

### Prerequisites
- PHP 8.2+
- Node.js 18+
- Python 3.11+
- MySQL 8.0+
- Composer
- npm or pnpm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/playstore-opportunity-hunter.git
cd playstore-opportunity-hunter

# 2. Configure environment files
cp backend/.env.example backend/.env
cp python-service/.env.example python-service/.env
cp frontend/.env.example frontend/.env

# 3. Install backend dependencies
cd backend
composer install
php artisan key:generate
php artisan migrate

# 4. Install Python service dependencies
cd ../python-service
pip install -r requirements.txt

# 5. Install frontend dependencies
cd ../frontend
npm install

# 6. Start all services (see below)
```

### Running the Application

#### Option 1: Docker Compose (Recommended)
```bash
docker-compose up -d
```

#### Option 2: Manual Setup

Open 5 terminal windows:

```bash
# Terminal 1: Laravel Backend
cd backend
php artisan serve

# Terminal 2: Laravel Queue Worker
cd backend
php artisan queue:work --sleep=3 --tries=3

# Terminal 3: Laravel Scheduler
cd backend
php artisan schedule:work

# Terminal 4: Python Service
cd python-service
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Terminal 5: React Frontend
cd frontend
npm run dev
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/v1
- **Python Service**: http://localhost:8001
- **FastAPI Docs**: http://localhost:8001/docs

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│              ┌─────────────────────────────────────┐        │
│              │  Dashboard | Scanner | Settings     │        │
│              └─────────────────────────────────────┘        │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP + JWT
┌───────────────────────────▼─────────────────────────────────┐
│                  Backend (Laravel API)                       │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐  │
│  │   Auth      │ │   Jobs       │ │     Scheduler       │  │
│  │  (Sanctum)  │ │   (Queue)    │ │    (Cron Jobs)      │  │
│  └──────┬──────┘ └──────┬───────┘ └─────────────────────┘  │
│         │                │                                   │
│         │         ┌──────▼───────┐                          │
│         │         │  Controllers │                          │
│         │         └──────┬───────┘                          │
│         │                │                                   │
│         │                │ HTTP Requests                    │
└─────────┼────────────────┼───────────────────────────────────┘
          │                │
          │         ┌──────▼───────────────────────┐
          └────────►│  Python Service (FastAPI)   │
                    │  ┌────────────────────────┐  │
                    │  │  Scraper Service       │  │
                    │  │  AI Service            │  │
                    │  └────────────────────────┘  │
                    └──────────┬───────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
    ┌────▼────┐          ┌────▼────┐         ┌──────▼──────┐
    │  MySQL  │          │  Mistral │         │   OpenAI    │
    │Database │          │   AI     │         │  (Fallback) │
    └─────────┘          └─────────┘         └─────────────┘
```

### Why This Architecture?

**Laravel** handles:
- User authentication & authorization
- CRUD operations
- Queue management & job processing
- Scheduled tasks & automation
- Notifications (Email, Telegram, Discord)
- API routing & middleware

**FastAPI (Python)** handles:
- Google Play Store scraping (Python-specific libraries)
- AI API calls (Mistral/OpenAI integration)
- Heavy data processing
- Asynchronous operations

**React** handles:
- Modern, responsive UI
- Real-time data visualization
- User interactions
- State management

---

## 📡 API Documentation

### Authentication
```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/user
```

### Scanning
```http
POST /api/v1/scan/category
POST /api/v1/scan/search
GET  /api/v1/scan/jobs
GET  /api/v1/scan/jobs/{id}
```

### Opportunities
```http
GET    /api/v1/opportunities
GET    /api/v1/opportunities/{id}
PUT    /api/v1/opportunities/{id}
DELETE /api/v1/opportunities/{id}
```

### AI Analysis
```http
POST /api/v1/ai/analyze/{appId}
GET  /api/v1/ai/analysis/{appId}
POST /api/v1/ai/research/{appId}
```

### Automation
```http
GET  /api/v1/automation
POST /api/v1/automation/enable
POST /api/v1/automation/disable
PUT  /api/v1/automation/schedule
GET  /api/v1/automation/history
```

### Notifications
```http
GET    /api/v1/notifications
POST   /api/v1/notifications/{id}/read
POST   /api/v1/notifications/read-all
DELETE /api/v1/notifications/{id}
```

For complete API documentation, visit: [Full API Reference](#)

---

## 🔧 Configuration

### AI Provider Setup

Edit `python-service/.env`:

```bash
# Primary AI Provider (mistral or openai)
AI_PROVIDER=mistral

# Mistral AI Configuration
MISTRAL_API_KEY=your-mistral-api-key
MISTRAL_API_URL=https://api.mistral.ai/v1
MISTRAL_MODEL=mistral-large-latest

# OpenAI Fallback Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
```

### Database Configuration

Edit `backend/.env`:

```bash
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=playstore_hunter
DB_USERNAME=your-username
DB_PASSWORD=your-password
```

### Notification Setup

Edit `backend/.env`:

```bash
# Email Notifications
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token

# Discord (user setting in UI)
```

---

## 🗂️ Project Structure

```
playstore-opportunity-hunter/
├── frontend/                 # React + TypeScript Application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Zustand state management
│   │   └── lib/             # Utilities & API client
│   ├── public/
│   └── package.json
│
├── backend/                  # Laravel Application
│   ├── app/
│   │   ├── Http/Controllers/  # API Controllers
│   │   ├── Models/           # Eloquent Models
│   │   ├── Jobs/             # Queue Jobs
│   │   └── Services/         # Business Logic
│   ├── database/
│   │   └── migrations/       # Database Schema
│   ├── routes/
│   └── config/
│
├── python-service/           # FastAPI Application
│   ├── app/
│   │   ├── api/             # API Routers
│   │   └── services/        # Scraping & AI Services
│   └── requirements.txt
│
├── docs/                     # Documentation
├── docker-compose.yml        # Docker Configuration
└── README.md
```

---

## 🧪 Testing

### Backend (Laravel)
```bash
cd backend
php artisan test
```

### Frontend (React)
```bash
cd frontend
npm run test
```

### Python Service
```bash
cd python-service
pytest
```

---

## 📦 Deployment

### Production Checklist

- [ ] Set `APP_ENV=production` in backend `.env`
- [ ] Set `APP_DEBUG=false` in backend `.env`
- [ ] Configure HTTPS for all API endpoints
- [ ] Set up CORS for production domain
- [ ] Configure queue workers with Supervisor
- [ ] Set up Laravel Scheduler cron job
- [ ] Configure proper logging and monitoring
- [ ] Set up database backups
- [ ] Use production API keys
- [ ] Enable rate limiting

### Supervisor Configuration

```ini
[program:playstore-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/backend/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/path/to/storage/logs/worker.log
```

### Laravel Scheduler Cron

```bash
* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.

---

## 🔒 Security

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens with 24-hour expiration
- ✅ SQL injection prevention via Eloquent ORM
- ✅ XSS prevention with input sanitization
- ✅ CORS configuration for API security
- ✅ Rate limiting on API endpoints
- ✅ API keys stored in environment variables
- ✅ Sanctum for API authentication

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Laravel](https://laravel.com/) - The PHP Framework for Web Artisans
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [FastAPI](https://fastapi.tiangolo.com/) - Modern, fast web framework for building APIs
- [Mistral AI](https://mistral.ai/) - Advanced AI for analysis
- [google-play-scraper](https://github.com/facundoolano/google-play-scraper) - Google Play Store scraper

---

## 📞 Support

For issues, questions, or suggestions:
- 📧 Email: support@example.com
- 🐛 [Report a Bug](https://github.com/yourusername/playstore-opportunity-hunter/issues)
- 💡 [Feature Request](https://github.com/yourusername/playstore-opportunity-hunter/issues/new?template=feature_request.md)

---

<div align="center">

**Made with ❤️ for the developer community**

[⬆ Back to Top](#-play-store-opportunity-hunter)

</div>
