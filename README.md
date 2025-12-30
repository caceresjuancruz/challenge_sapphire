# Comments API

> RESTful API for comments management built with Express.js, TypeScript, and Clean Architecture principles.

[![CI Pipeline](https://github.com/yourusername/comments-api/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/comments-api/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-87%25-brightgreen.svg)](./coverage)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)

## Table of Contents

- [Description](#description)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Swagger Documentation](#swagger-documentation)
- [Testing](#testing)
- [Docker](#docker)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Design Principles](#design-principles)

## Description

A production-ready RESTful API for managing comments, implementing CRUD operations with pagination, validation, and comprehensive error handling. Built following Clean Architecture and SOLID principles.

### Key Features

- Complete CRUD operations for comments
- Pagination with customizable sorting
- Input validation with Zod schemas
- Centralized error handling
- Dependency Injection with Inversify
- Interactive API documentation with Swagger/OpenAPI
- 87%+ test coverage with Jest
- Docker support for easy deployment
- CI/CD pipeline with GitHub Actions

## Architecture

The project follows a **Layered Architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│                    HTTP Request                     │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                     Routes                          │
│            (Express Router + Validation)            │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                   Controllers                       │
│            (HTTP Request/Response handling)         │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                    Services                         │
│              (Business Logic Layer)                 │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                  Repositories                       │
│               (Data Access Layer)                   │
└─────────────────────────────────────────────────────┘
```

### Dependency Injection

The project uses **Inversify** as IoC container for dependency injection, enabling:
- Loose coupling between components
- Easy unit testing with mocks
- Centralized dependency management

## Technologies

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js 20+ |
| **Language** | TypeScript 5.9 |
| **Framework** | Express.js 5.x |
| **Validation** | Zod 4.x |
| **DI Container** | Inversify 7.x |
| **API Docs** | Swagger/OpenAPI 3.0 |
| **Testing** | Jest + Supertest |
| **Linting** | ESLint + Prettier |
| **Containerization** | Docker |
| **CI/CD** | GitHub Actions |

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Docker** (optional, for containerization)

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/comments-api.git
cd comments-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

4. **Build the project**
```bash
npm run build
```

## Running the Application

### Development Mode
```bash
npm run dev
```
The server will start at `http://localhost:3000` with hot-reload enabled.

### Production Mode
```bash
npm run build
npm start
```

### Using Docker
```bash
# Build and run with Docker Compose
npm run docker:up

# Or build and run manually
npm run docker:build
npm run docker:run
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/comments` | Get all comments (paginated) |
| `GET` | `/api/v1/comments/:id` | Get a comment by ID |
| `POST` | `/api/v1/comments` | Create a new comment |
| `PUT` | `/api/v1/comments/:id` | Update a comment |
| `DELETE` | `/api/v1/comments/:id` | Delete a comment |
| `GET` | `/health` | Health check endpoint |

### Pagination Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max: 100) |
| `sortBy` | string | createdAt | Sort field (createdAt, updatedAt) |
| `sortOrder` | string | desc | Sort order (asc, desc) |

### Example Requests

**Create a comment:**
```bash
curl -X POST http://localhost:3000/api/v1/comments \
  -H "Content-Type: application/json" \
  -d '{"content": "This is a comment", "authorId": "550e8400-e29b-41d4-a716-446655440000"}'
```

**Get paginated comments:**
```bash
curl "http://localhost:3000/api/v1/comments?page=1&limit=5&sortOrder=desc"
```

## Swagger Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:3000/api-docs`
- **OpenAPI JSON**: `http://localhost:3000/api-docs.json`

## Testing

The project includes comprehensive unit and integration tests with **87%+ coverage**.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests for CI (with coverage)
npm run test:ci
```

### Coverage Report

After running tests, the coverage report is available at `./coverage/lcov-report/index.html`.

## Docker

### Build the image
```bash
npm run docker:build
```

### Run with Docker Compose (Production)
```bash
npm run docker:up
```

### Run in Development Mode
```bash
npm run docker:dev
```

### Stop containers
```bash
npm run docker:down
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors automatically |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run docker:build` | Build Docker image |
| `npm run docker:up` | Start with Docker Compose |
| `npm run docker:down` | Stop Docker containers |

## Project Structure

```
src/
├── app.ts                              # Express app configuration
├── server.ts                           # Application entry point
├── config/
│   ├── container.ts                    # Inversify DI configuration
│   ├── types.ts                        # DI symbols/tokens
│   └── swagger.ts                      # OpenAPI configuration
├── controllers/
│   └── comment.controller.ts           # HTTP request handlers
├── services/
│   ├── comment.service.ts              # Business logic
│   └── interfaces/
│       └── comment.service.interface.ts
├── repositories/
│   ├── comment.repository.ts           # Data access layer
│   └── interfaces/
│       └── comment.repository.interface.ts
├── models/
│   ├── entities/
│   │   └── comment.entity.ts           # Domain entity
│   └── dto/
│       ├── create-comment.dto.ts       # Create DTO
│       └── update-comment.dto.ts       # Update DTO
├── middleware/
│   ├── error-handler.middleware.ts     # Centralized error handling
│   └── validation.middleware.ts        # Request validation
├── validators/
│   ├── comment.validator.ts            # Zod schemas for comments
│   └── pagination.validator.ts         # Zod schemas for pagination
├── routes/
│   └── comment.routes.ts               # Route definitions
└── utils/
    ├── errors/
    │   ├── app-error.ts                # Base error class
    │   └── not-found.error.ts          # 404 error class
    └── pagination/
        ├── pagination.helper.ts        # Pagination logic
        └── pagination.types.ts         # Pagination types
```

## Design Principles

### SOLID Principles

- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Interfaces ensure substitutability
- **Interface Segregation**: Small, focused interfaces
- **Dependency Inversion**: Depend on abstractions, not concretions

### Clean Architecture

- **Independence from frameworks**: Business logic is independent of Express
- **Testability**: All layers can be tested in isolation
- **Independence from UI**: API could be replaced without affecting business logic
- **Independence from database**: Repository pattern abstracts data storage

### Patterns Used

- **Repository Pattern**: Abstracts data access layer
- **Service Pattern**: Encapsulates business logic
- **Dependency Injection**: Loose coupling via Inversify
- **DTO Pattern**: Data transfer objects for API contracts
- **Factory Pattern**: Application and container creation

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment (development, production) |

## License

This project is licensed under the ISC License.

---

Made with TypeScript, Express.js, and Clean Architecture principles.
