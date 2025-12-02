# AI Virtual Assistant - Backend API

Express.js backend for the AI Virtual Assistant application.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

**Important**: Update these values in `.env`:
- `DB_PASSWORD`: Your PostgreSQL password
- `JWT_SECRET`: A secure random string
- `OPENAI_API_KEY`: Your OpenAI API key (if using AI features)

### 3. Set Up PostgreSQL Database

Install PostgreSQL if not already installed:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql
```

Create the database:
```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE ai_assistant;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE ai_assistant TO postgres;
\q
```

### 4. Start the Server
```bash
npm run dev
```

The server will start on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Projects
- `GET /api/projects` - Get all projects (z )
- `POST /api/projects` - Create project (protected)
- `GET /api/projects/:id` - Get single project (protected)
- `PUT /api/projects/:id` - Update project (protected)
- `DELETE /api/projects/:id` - Delete project (protected)
- `GET /api/projects/:id/files` - Get project files (protected)

### Files
- `POST /api/files/projects/:id/upload` - Upload files (protected)
- `DELETE /api/files/:id` - Delete file (protected)

## Database Schema

### users
- id (SERIAL PRIMARY KEY)
- email (VARCHAR UNIQUE)
- password_hash (VARCHAR)
- name (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### projects
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER FK)
- name (VARCHAR)
- description (TEXT)
- status (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### files
- id (SERIAL PRIMARY KEY)
- project_id (INTEGER FK)
- name (VARCHAR)
- path (TEXT)
- type (VARCHAR)
- size (INTEGER)
- content (TEXT)
- summary (TEXT)
- language (VARCHAR)
- created_at (TIMESTAMP)

### file_embeddings
- id (SERIAL PRIMARY KEY)
- file_id (INTEGER FK)
- chunk_index (INTEGER)
- chunk_text (TEXT)
- embedding (FLOAT8[])
- created_at (TIMESTAMP)

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── config.js          # Environment configuration
│   │   └── database.js        # Database connection
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   ├── projectController.js
│   │   └── fileController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   └── errorHandler.js    # Error handling
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   └── fileRoutes.js
│   └── server.js              # Main server file
├── uploads/                   # File uploads directory
├── .env                       # Environment variables
├── .env.example              # Environment template
├── package.json
└── README.md
```

## Development

The server uses nodemon for auto-restart during development:
```bash
npm run dev
```

For production:
```bash
npm start
```
