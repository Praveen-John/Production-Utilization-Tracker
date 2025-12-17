# Production & Utilization Tracker

A comprehensive web application for tracking production metrics and utilization data with real-time dashboard capabilities, user management, and AI-powered insights.

## Features

### User Management
- **Role-based authentication**: Admin and User roles with different access levels
- **User account management**: Create, update, disable, and delete users
- **Real-time session validation**: Automatic logout when accounts are disabled
- **Persistent login sessions**: Using localStorage for user session management

### Production Tracking
- **Data entry forms**: Intuitive forms for production and utilization data
- **Record management**: Create, update, and delete production records
- **Time study functionality**: Specialized time tracking and analysis
- **Real-time data synchronization**: Frontend-backend data consistency

### Dashboard & Analytics
- **Admin Dashboard**: Comprehensive overview of all users and records
- **User Dashboard**: Personal production metrics and data entry
- **Interactive charts**: Data visualization using Recharts
- **PDF export capabilities**: Generate reports using jsPDF and html2canvas

### AI Integration
- **ChatBot functionality**: AI-powered assistance using Google Gemini API
- **Smart data analysis**: AI insights for production optimization
- **Natural language interface**: User-friendly AI interactions

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

- **Frontend**: Vite dev server (React + TypeScript)
- **Backend**: Express server (Node.js)

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
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PATCH /api/users` - Update user (supports partial updates)
- `DELETE /api/users` - Delete user
- `POST /api/records` - Create new production record
- `PUT /api/records` - Update production record
- `DELETE /api/records` - Delete production record
- `GET /api/health` - Health check endpoint

## Application Architecture

### Frontend Components
- **App.tsx**: Main application component with routing and state management
- **Login.tsx**: User authentication interface
- **AdminDashboard.tsx**: Administrative interface for user and data management
- **UserDashboard.tsx**: User interface for data entry and personal metrics
- **DataEntryForm.tsx**: Form component for production data input
- **TimeStudy.tsx**: Time tracking and analysis component
- **ChatBot.tsx**: AI-powered chat interface
- **ConfirmationModal.tsx**: Reusable modal for confirmations

### Backend Architecture
- **Express.js server**: RESTful API with CORS support
- **MongoDB integration**: NoSQL database for data persistence
- **TypeScript support**: Type-safe backend development
- **Environment configuration**: Secure configuration management

### Data Models
- **User**: Authentication, roles (Admin/User), account status
- **ProductionRecord**: Production metrics, timestamps, user associations
- **Real-time validation**: Client-server data consistency

## Build & Deployment

To build the application for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

For production deployment:

```bash
npm start
```

## Technology Stack

### Frontend
- **React 18**: Modern UI framework with hooks
- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and development server
- **Recharts**: Data visualization and charting library
- **Lucide React**: Modern icon library
- **jsPDF & html2canvas**: PDF generation and export
- **@google/genai**: Google Gemini AI integration

### Backend
- **Node.js**: JavaScript runtime
- **Express 5**: Web application framework
- **MongoDB**: NoSQL database
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **UUID**: Unique identifier generation

### Development Tools
- **TypeScript**: Type safety across the full stack
- **ts-node**: TypeScript execution for Node.js
- **Concurrently**: Run multiple development scripts
- **Vite**: Optimized bundling and hot reload

## Project Structure

```
Production-Utilization-Tracker/
├── components/           # React components
│   ├── Login.tsx
│   ├── AdminDashboard.tsx
│   ├── UserDashboard.tsx
│   ├── DataEntryForm.tsx
│   ├── TimeStudy.tsx
│   ├── ChatBot.tsx
│   └── ConfirmationModal.tsx
├── services/            # Service layer
│   └── geminiService.ts # AI service integration
├── App.tsx              # Main application component
├── index.tsx           # Application entry point
├── types.ts            # TypeScript type definitions
├── constants.ts        # Application constants
├── vite.config.ts      # Vite configuration
├── server.js           # Backend server entry point
├── package.json        # Project dependencies
└── .env.sample         # Environment template
```

## Security Features

- **Role-based access control**: Admin and user role separation
- **Account disable functionality**: Admin can disable user accounts
- **Real-time session validation**: Automatic logout for disabled accounts
- **Secure password handling**: Backend authentication validation
- **CORS configuration**: Secure cross-origin requests
- **Environment variable protection**: Sensitive data in .env files

## Contributing

This project uses TypeScript for type safety and modern React patterns. When contributing:

1. Follow existing code patterns and TypeScript conventions
2. Test both frontend and backend functionality
3. Ensure proper error handling and user feedback
4. Update documentation for new features

## License

ISC License
