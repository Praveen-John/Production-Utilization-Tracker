<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Production & Utilization Tracker

A comprehensive web application for tracking production metrics and utilization data with real-time dashboard capabilities.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB database access
- Google Gemini API key (for AI features)

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI="your_mongodb_connection_string"
VITE_API_KEY="your_gemini_api_key"
```

You can use `.env.sample` as a template.

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

The application runs with separate frontend and backend servers:

- **Frontend**: Vite dev server (React)
- **Backend**: Express server (Node.js with TypeScript)

To start the development environment:

```bash
npm run dev
```

This will start:
- Frontend at: http://localhost:5173
- Backend API at: http://localhost:3000

### Individual Services

You can also run frontend and backend separately:

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

## API Endpoints

- `GET /api/data` - Fetch all users and records
- `POST /api/login` - User authentication
- `POST /api/users` - Create new user
- `PUT /api/users` - Update user
- `POST /api/records` - Create new record
- `PUT /api/records` - Update record
- `DELETE /api/records` - Delete record
- `GET /api/health` - Health check endpoint

## Build & Deployment

To build the application for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite (build tool)
- Recharts (charts)
- Lucide React (icons)
- jsPDF & html2canvas (PDF generation)

### Backend
- Node.js
- Express
- TypeScript
- MongoDB
- CORS support

### Dev Dependencies
- ts-node (TypeScript execution)
- Concurrently (run multiple scripts)
- ESLint & Prettier (code formatting)
