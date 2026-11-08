# Enterprise Incident & Service Management Portal

A full-stack incident management application built using **React, TypeScript, Node.js, Express, and MongoDB**. The platform helps employees report incidents, support agents manage assigned issues, and administrators oversee incident operations through a centralized dashboard.

## Project Overview

The Enterprise Incident & Service Management Portal is designed to simplify internal IT support operations through structured incident reporting, role-based access, assignment management, SLA tracking, comments, and activity auditing.

The application follows a modular backend architecture and uses JWT authentication with role-based authorization to protect application resources.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- CSS
- Axios
- React Hot Toast
- Lucide React

### Backend

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcrypt

### Development Tools

- Git and GitHub
- Thunder Client
- MongoDB Atlas
- VS Code

## User Roles

The application supports three roles:

| Role          | Permissions                                                                             |
| ------------- | --------------------------------------------------------------------------------------- |
| Admin         | Manage and monitor incidents, assign support agents, and oversee operations             |
| Support Agent | View incidents, manage assigned work, update statuses, and communicate through comments |
| Employee      | Create incidents, view their own incidents, and add or edit their own comments          |

Role-based access control is enforced on the backend, not just through frontend visibility.

## Key Features

### 1. Authentication and Authorization

- User registration and login.
- JWT-based authentication.
- Password hashing.
- Protected API routes.
- Role-based access control.
- Current-user authentication endpoint.

### 2. Incident Management

- Create and report incidents.
- View incident details.
- Track incident status.
- Assign incidents to support agents.
- Filter and search incidents.
- Pagination support.

### 3. Incident Priority and SLA Management

Supported priorities:

- Critical
- High
- Medium
- Low

SLA targets:

| Priority | SLA Target |
| -------- | ---------: |
| Critical |    2 Hours |
| High     |    4 Hours |
| Medium   |    8 Hours |
| Low      |   24 Hours |

The application calculates incident due dates based on priority and provides overdue incident tracking.

### 4. Comments and Edit History

- Add comments to incidents.
- Edit comments authored by the logged-in user.
- Preserve the original comment.
- Maintain multiple edited versions.
- Record editor identity and edit timestamps.
- Display original and edited versions in the UI.
- Prevent unauthorized users from editing another user's comments.

### 5. Activity Audit Logs

- Track incident creation.
- Track status changes.
- Track support-agent assignments.
- Track comments and comment edits.
- Record the user responsible for each activity.

### 6. Dashboard

- Role-specific dashboard statistics.
- Total incidents.
- Open incidents.
- In-progress incidents.
- Resolved incidents.
- Overdue incidents.
- Recent incident information.

Dashboard data is scoped according to the user's permissions.

## Application Architecture

The application follows a **Modular Monolith Architecture** with separate frontend and backend applications.

```text
Enterprise-Incident-Portal/
│
├── client/
│   └── src/
│       ├── components/
│       ├── App.tsx
│       ├── AuthPage.tsx
│       └── ...
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   └── ...
│
└── README.md
```

### Backend Request Flow

```text
Client Request
      ↓
    Routes
      ↓
  Middleware
      ↓
  Controller
      ↓
   Service
      ↓
    Model
      ↓
   MongoDB
```

The service layer handles business logic, while controllers handle HTTP requests and responses.

## API Overview

Base URL:

```text
http://localhost:5000/api
```

### Authentication

| Method | Endpoint         | Purpose                        |
| ------ | ---------------- | ------------------------------ |
| POST   | `/auth/register` | Register a user                |
| POST   | `/auth/login`    | Authenticate a user            |
| GET    | `/auth/me`       | Get current authenticated user |

### Incidents

| Method | Endpoint                       | Purpose                       |
| ------ | ------------------------------ | ----------------------------- |
| POST   | `/incidents`                   | Create an incident            |
| GET    | `/incidents`                   | Retrieve incidents            |
| GET    | `/incidents/:id`               | Retrieve incident details     |
| PATCH  | `/incidents/:id/assign`        | Assign a support agent        |
| GET    | `/incidents/dashboard/summary` | Retrieve dashboard statistics |

### Comments

| Method | Endpoint                             | Purpose                    |
| ------ | ------------------------------------ | -------------------------- |
| POST   | `/incidents/:id/comments`            | Add a comment              |
| GET    | `/incidents/:id/comments`            | Retrieve incident comments |
| PATCH  | `/incidents/:id/comments/:commentId` | Edit an existing comment   |

All protected endpoints require an appropriate JWT bearer token. Access is restricted according to the authenticated user's role and resource ownership.

## Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB Atlas account or MongoDB instance
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Anandh25/enterprise-incident-portal.git
```

```bash
cd enterprise-incident-portal
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the `server` directory.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
```

Replace the placeholder values with your own configuration.

**Important:** Never commit `.env` files, database credentials, JWT secrets, or access tokens to GitHub.

### 4. Start the Backend

From the `server` directory:

```bash
npm run dev
```

Backend runs at:

```text
http://localhost:5000
```

### 5. Install Frontend Dependencies

Open a new terminal:

```bash
cd client
npm install
```

### 6. Start the Frontend

```bash
npm run dev
```

Open the Vite development URL shown in your terminal, usually:

```text
http://localhost:5173
```

## Build Verification

To verify the frontend:

```bash
cd client
npm run build
```

To verify the backend:

```bash
cd server
npm run build
```

## Security Considerations

- Passwords are hashed before storage.
- JWT authentication protects private API endpoints.
- Role-based authorization is enforced on the server.
- Incident access is restricted according to user permissions.
- Users can edit only their own comments.
- Original comment versions are preserved.
- Sensitive environment variables are excluded from Git.

## Future Enhancements

Potential improvements include:

- Email notifications for incident updates.
- Advanced reporting and analytics.
- File attachments for incident reports.
- Deployment with production environment configuration.
- Automated backend and frontend tests.

## Author

**Anandh Manoharan**

GitHub: [Anandh25](https://github.com/Anandh25)

Project Repository: [Enterprise Incident & Service Management Portal](https://github.com/Anandh25/enterprise-incident-portal)

---

_Built as a practical full-stack project to explore enterprise-style incident workflows, TypeScript, backend architecture, authentication, authorization, and application security._
