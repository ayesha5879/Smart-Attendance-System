# Smart Attendance System

An AI-powered face recognition attendance management system for educational institutions.

## Features

- **Face Recognition** – Mark attendance via webcam-based facial recognition using face-api.js
- **Real-Time Monitoring** – Live attendance tracking with Socket.IO
- **AI Analytics & Insights** – Predictive attendance patterns and data-driven insights
- **Comprehensive Reporting** – Export reports in PDF, CSV, and Excel formats
- **Role-Based Access** – Separate dashboards for admins and students
- **Notifications** – Automated alerts for attendance, corrections, and system events
- **Audit Logging** – Full trail of all system activities
- **Attendance Corrections** – Workflow for students to request and admins to approve corrections
- **Dark Mode** – Toggleable dark/light theme

## Tech Stack

**Backend:** Node.js, Express, Sequelize ORM, PostgreSQL, Socket.IO  
**Frontend:** React, Vite, Tailwind CSS, Chart.js, Recharts  
**AI/ML:** face-api.js, sharp (image processing)  
**DevOps:** Docker, Docker Compose

## Installation

### Prerequisites

- Node.js v18+
- PostgreSQL
- Docker (optional)

### Setup

```bash
# Clone the repository
git clone https://github.com/ayesha5879/Smart-Attendance-System.git
cd smart-attendance-system

# Install backend dependencies
cd backend && npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx sequelize-cli db:migrate

# Seed initial data
npm run seed

# Install frontend dependencies
cd ../frontend && npm install

# Start development servers
# Terminal 1 (backend)
cd backend && npm run dev

# Terminal 2 (frontend)
cd frontend && npm run dev
```

### Using Docker

```bash
docker-compose up --build
```

## Project Structure

```
├── backend/           # Express API server
│   ├── src/
│   │   ├── config/    # Database & app configuration
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/    # Auth, audit, error handling
│   │   ├── models/       # Sequelize models
│   │   ├── routes/       # API route definitions
│   │   ├── services/     # Business logic (face, analytics, reports, etc.)
│   │   └── seeders/      # Sample data
│   └── package.json
├── frontend/          # React client
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page-level components
│   │   └── hooks/       # Custom React hooks
│   └── package.json
├── database/          # SQL init scripts
├── docker/            # Docker configuration
└── docs/              # Project documentation
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/auth` | Authentication & user management |
| `/api/students` | Student CRUD operations |
| `/api/courses` | Course management |
| `/api/attendance` | Attendance recording & queries |
| `/api/face` | Face registration & recognition |
| `/api/analytics` | Attendance analytics |
| `/api/insights` | AI-powered predictions |
| `/api/notifications` | Notification management |
| `/api/reports` | Report generation (PDF/CSV/Excel) |
| `/api/admin` | Admin dashboard operations |
| `/api/corrections` | Attendance correction requests |

## License

MIT