# CLAUDE.md - Project Guidelines

This file contains the rules and standards that Claude must follow when working on this project.

---

## Project Overview

**Comments API** - A RESTful API for managing comments built with:
- **Express.js 5.x** - Web framework
- **TypeScript 5.9** - Type-safe JavaScript
- **Inversify** - Dependency Injection container
- **Zod** - Schema validation
- **Jest** - Testing framework
- **In-memory storage** - Map-based data persistence

---

## Architecture

This project follows **Layered Architecture** with **Dependency Injection**:

```
Controllers → Services → Repositories
     ↓            ↓            ↓
  HTTP I/O    Business    Data Access
              Logic
```

### Key Principles

1. **Interface-based design** - All services and repositories have interfaces
2. **Dependency Injection** - Use Inversify for IoC
3. **Single Responsibility** - Each layer has one job
4. **Error propagation** - Errors bubble up through layers

---

## Project Structure

```
src/
├── events/                # Event-driven architecture
│   ├── interfaces/
│   │   └── event-bus.interface.ts
│   ├── types/
│   │   └── domain-events.ts
│   └── in-memory-event-bus.ts
├── controllers/           # HTTP request handlers
│   ├── comment.controller.ts
│   └── notification.controller.ts
├── services/              # Business logic
│   ├── comment.service.ts
│   ├── notification.service.ts
│   ├── logger/
│   │   ├── logger.service.ts
│   │   └── logger.service.interface.ts
│   └── interfaces/
│       ├── comment.service.interface.ts
│       └── notification.service.interface.ts
├── repositories/          # Data access layer
│   ├── comment.repository.ts
│   ├── notification.repository.ts
│   └── interfaces/
│       ├── comment.repository.interface.ts
│       └── notification.repository.interface.ts
├── models/
│   ├── dto/               # Data Transfer Objects
│   │   ├── create-comment.dto.ts
│   │   ├── update-comment.dto.ts
│   │   └── create-notification.dto.ts
│   └── entities/          # Domain entities
│       ├── comment.entity.ts
│       └── notification.entity.ts
├── validators/            # Zod validation schemas
│   ├── comment.validator.ts
│   ├── pagination.validator.ts
│   └── notification.validator.ts
├── middleware/            # Express middleware
│   ├── error-handler.middleware.ts
│   └── validation.middleware.ts
├── routes/                # Route definitions
│   ├── comment.routes.ts
│   └── notification.routes.ts
├── config/                # Configuration
│   ├── container.ts       # DI container setup
│   ├── types.ts           # DI symbols
│   └── swagger.ts         # OpenAPI config
├── utils/
│   ├── errors/            # Custom error classes
│   │   ├── app-error.ts
│   │   └── not-found.error.ts
│   └── pagination/        # Pagination utilities
│       ├── pagination.helper.ts
│       └── pagination.types.ts
├── app.ts                 # Express app factory
└── server.ts              # Entry point (DO NOT MODIFY)

tests/
├── unit/                  # Mirrors src/ structure
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── middleware/
│   ├── validators/
│   ├── events/
│   └── utils/
└── integration/           # API integration tests
```

---

## Naming Conventions

### Files (kebab-case with suffix)

| Type | Pattern | Example |
|------|---------|---------|
| Controller | `{domain}.controller.ts` | `comment.controller.ts` |
| Service | `{domain}.service.ts` | `comment.service.ts` |
| Repository | `{domain}.repository.ts` | `comment.repository.ts` |
| Interface | `{domain}.{layer}.interface.ts` | `comment.service.interface.ts` |
| DTO | `{action}-{domain}.dto.ts` | `create-comment.dto.ts` |
| Entity | `{domain}.entity.ts` | `comment.entity.ts` |
| Validator | `{domain}.validator.ts` | `comment.validator.ts` |
| Middleware | `{name}.middleware.ts` | `error-handler.middleware.ts` |
| Test | `{source}.test.ts` | `comment.service.test.ts` |

### Classes and Interfaces (PascalCase)

| Type | Pattern | Example |
|------|---------|---------|
| Service Class | `{Domain}Service` | `CommentService` |
| Service Interface | `I{Domain}Service` | `ICommentService` |
| Repository Class | `{Domain}Repository` | `CommentRepository` |
| Repository Interface | `I{Domain}Repository` | `ICommentRepository` |
| Controller Class | `{Domain}Controller` | `CommentController` |
| Error Class | `{Name}Error` | `NotFoundError` |
| DTO Interface | `{Action}{Domain}Dto` | `CreateCommentDto` |

### Variables and Functions (camelCase)

- Use descriptive names: `findById`, `createComment`
- Boolean prefixes: `is`, `has`, `should`, `can`
- Unused parameters: prefix with underscore `_next`, `_res`

---

## Code Patterns

### Controller Pattern

```typescript
@injectable()
export class CommentController {
  constructor(
    @inject(TYPES.CommentService)
    private readonly commentService: ICommentService
  ) {}

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const comment = await this.commentService.findById(id);
      res.status(200).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      next(error);  // Always pass errors to next()
    }
  }
}
```

### Service Pattern

```typescript
@injectable()
export class CommentService implements ICommentService {
  constructor(
    @inject(TYPES.CommentRepository)
    private readonly commentRepository: ICommentRepository
  ) {}

  async findById(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw new NotFoundError('Comment', id);  // Throw for not found
    }
    return comment;
  }
}
```

### Repository Pattern

```typescript
@injectable()
export class CommentRepository implements ICommentRepository {
  private comments: Map<string, Comment> = new Map();

  async findById(id: string): Promise<Comment | null> {
    return this.comments.get(id) ?? null;  // Return null, never throw
  }
}
```

### Validation Pattern (Zod)

```typescript
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be less than 5000 characters')
    .trim(),
  authorId: z.string().uuid('Invalid author ID format'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
```

### Response Format

```typescript
// Success with data
res.status(200).json({
  success: true,
  data: comment,
});

// Success with pagination
res.status(200).json({
  success: true,
  data: comments,
  meta: {
    total: 100,
    page: 1,
    limit: 10,
    totalPages: 10,
    hasNextPage: true,
    hasPrevPage: false,
  },
});

// Success message only
res.status(200).json({
  success: true,
  message: 'Comment deleted successfully',
});

// Error response (handled by middleware)
{
  success: false,
  error: {
    message: 'Comment not found',
    code: 'NOT_FOUND',
    statusCode: 404,
  },
  timestamp: '2024-01-01T00:00:00.000Z',
  path: '/api/v1/comments/123',
}
```

---

## Nested Comments (Replies)

Comments support hierarchical threading through the `parentId` field:

- `parentId: null` = Root comment (top-level)
- `parentId: <uuid>` = Reply to another comment

### Reply Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/comments/:id/replies` | Get paginated replies |
| POST | `/api/v1/comments/:id/replies` | Create reply to a comment |

### Behavior

1. **Root comments only in listing** - `GET /api/v1/comments` returns only root comments (`parentId = null`)
2. **Cascade delete** - Deleting a parent comment deletes all its replies recursively
3. **Parent validation** - Creating a reply validates that the parent exists

### Example: Creating a Reply

```typescript
// POST /api/v1/comments/:parentId/replies
{
  "content": "This is a reply",
  "authorId": "123e4567-e89b-12d3-a456-426614174001"
}

// Response
{
  "success": true,
  "data": {
    "id": "new-reply-uuid",
    "content": "This is a reply",
    "authorId": "123e4567-e89b-12d3-a456-426614174001",
    "parentId": "parent-comment-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Event-Driven Architecture

The application uses an event-driven architecture that enables loose coupling between services and facilitates future migration to microservices.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Monolith                                │
│                                                                 │
│   ┌─────────────┐                                               │
│   │   Comment   │                                               │
│   │   Service   │──emit──┐                                      │
│   └─────────────┘        │                                      │
│                          ▼                                      │
│                    ┌──────────┐                                 │
│                    │ IEventBus│ ←── Interface (swappable)       │
│                    └────┬─────┘                                 │
│                         │                                       │
│                    ┌────┴─────┐                                 │
│                    │InMemory  │ ←── Current implementation      │
│                    │EventBus  │     (Node.js EventEmitter)      │
│                    └────┬─────┘                                 │
│                         │                                       │
│                    ┌────┴─────────────┐                         │
│                    │  Notification    │                         │
│                    │    Service       │──subscribe──            │
│                    └──────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Domain Events

| Event Type | Trigger | Payload |
|------------|---------|---------|
| `comment.created` | New comment created | `commentId`, `content`, `authorId`, `parentId` |
| `comment.updated` | Comment modified | `commentId`, `content`, `authorId` |
| `comment.deleted` | Comment removed | `commentId`, `authorId` |
| `comment.replied` | Reply added | `commentId`, `parentId`, `parentAuthorId`, `replyAuthorId`, `content` |

### IEventBus Interface

```typescript
// src/events/interfaces/event-bus.interface.ts
export interface IEventBus {
  emit<T>(event: DomainEvent<T>): void;
  on<T>(eventType: EventType, handler: EventHandler<T>): void;
  off<T>(eventType: EventType, handler: EventHandler<T>): void;
}
```

### Emitting Events (Service Layer)

```typescript
@injectable()
export class CommentService implements ICommentService {
  constructor(
    @inject(TYPES.CommentRepository) private readonly repository: ICommentRepository,
    @inject(TYPES.EventBus) private readonly eventBus: IEventBus
  ) {}

  async create(dto: CreateCommentDto): Promise<Comment> {
    const comment = await this.repository.create(dto);

    // Emit domain event
    this.eventBus.emit({
      id: crypto.randomUUID(),
      type: EventType.COMMENT_CREATED,
      timestamp: new Date(),
      payload: {
        commentId: comment.id,
        content: comment.content,
        authorId: comment.authorId,
        parentId: comment.parentId,
      },
    });

    return comment;
  }
}
```

---

## Notification Service

The NotificationService listens to domain events and creates notifications automatically.

### How It Works

1. Service subscribes to events in constructor
2. When events are emitted, handlers create appropriate notifications
3. Notifications are stored and can be retrieved via REST API

### Notification Entity

```typescript
interface Notification {
  id: string;
  type: EventType;
  title: string;
  message: string;
  recipientId: string;      // User who receives the notification
  read: boolean;
  readAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
```

### Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications/user/:recipientId` | List user's notifications (paginated) |
| GET | `/api/v1/notifications/user/:recipientId/unread-count` | Get unread count |
| GET | `/api/v1/notifications/:id` | Get notification by ID |
| PATCH | `/api/v1/notifications/:id/read` | Mark as read |
| PATCH | `/api/v1/notifications/user/:recipientId/read-all` | Mark all as read |
| DELETE | `/api/v1/notifications/:id` | Delete notification |

### Event-to-Notification Mapping

| Event | Notification Title | Recipient |
|-------|-------------------|-----------|
| `comment.created` | "Comment Created" | Comment author |
| `comment.updated` | "Comment Updated" | Comment author |
| `comment.deleted` | "Comment Deleted" | Comment author |
| `comment.replied` | "New Reply" | Parent comment author |

---

## Microservice Migration Guide

The event-driven architecture is designed for easy migration to a distributed microservices architecture. Here's how to migrate the NotificationService to a separate microservice.

### Current State (Monolith)

```
┌────────────────────────────────────────┐
│              Monolith                  │
│                                        │
│  CommentService ──► InMemoryEventBus   │
│                           │            │
│                           ▼            │
│                  NotificationService   │
└────────────────────────────────────────┘
```

### Target State (Microservices)

```
┌──────────────────────┐     ┌───────────────────────┐
│   Comments Service   │     │ Notifications Service │
│                      │     │                       │
│  CommentService      │     │  NotificationService  │
│        │             │     │         ▲             │
│        ▼             │     │         │             │
│  RabbitMQEventBus    │     │  RabbitMQEventBus     │
└────────┬─────────────┘     └─────────┬─────────────┘
         │                             │
         │      ┌─────────────┐        │
         └─────►│  RabbitMQ   │◄───────┘
                │   /Redis    │
                └─────────────┘
```

### Step 1: Create Message Queue Adapter

```typescript
// src/events/rabbitmq-event-bus.ts
import { injectable } from 'inversify';
import { Connection, Channel } from 'amqplib';
import { IEventBus, EventHandler } from './interfaces/event-bus.interface.js';
import { DomainEvent, EventType } from './types/domain-events.js';

@injectable()
export class RabbitMQEventBus implements IEventBus {
  private channel: Channel;
  private handlers: Map<EventType, Set<EventHandler<unknown>>> = new Map();

  constructor(private connection: Connection) {}

  async init(): Promise<void> {
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange('domain_events', 'topic', { durable: true });
  }

  emit<T>(event: DomainEvent<T>): void {
    const message = JSON.stringify(event);
    this.channel.publish('domain_events', event.type, Buffer.from(message));
  }

  async on<T>(eventType: EventType, handler: EventHandler<T>): Promise<void> {
    const queue = await this.channel.assertQueue('', { exclusive: true });
    await this.channel.bindQueue(queue.queue, 'domain_events', eventType);

    this.channel.consume(queue.queue, (msg) => {
      if (msg) {
        const event = JSON.parse(msg.content.toString()) as DomainEvent<T>;
        handler(event);
        this.channel.ack(msg);
      }
    });

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler<unknown>);
  }

  off<T>(eventType: EventType, handler: EventHandler<T>): void {
    this.handlers.get(eventType)?.delete(handler as EventHandler<unknown>);
  }
}
```

### Step 2: Update DI Container

```typescript
// src/config/container.ts

// BEFORE: In-memory (same process)
container.bind<IEventBus>(TYPES.EventBus)
  .to(InMemoryEventBus)
  .inSingletonScope();

// AFTER: Message queue (distributed)
container.bind<IEventBus>(TYPES.EventBus)
  .to(RabbitMQEventBus)
  .inSingletonScope();
```

### Step 3: Create Notification Microservice

Create a new project with the following structure:

```
notification-service/
├── src/
│   ├── events/
│   │   └── rabbitmq-event-bus.ts    # Consumer implementation
│   ├── services/
│   │   └── notification.service.ts  # Same business logic
│   ├── repositories/
│   │   └── notification.repository.ts
│   ├── controllers/
│   │   └── notification.controller.ts
│   ├── routes/
│   │   └── notification.routes.ts
│   └── app.ts
├── package.json
└── tsconfig.json
```

### Step 4: Remove NotificationService from Monolith

1. Remove NotificationService, Repository, Controller from `container.ts`
2. Remove notification routes from `app.ts`
3. Delete notification-related files from `src/`
4. The CommentService continues emitting events - no changes needed

### Step 5: Configure Environment

```bash
# Comments Service
RABBITMQ_URL=amqp://localhost:5672
SERVICE_NAME=comments-api

# Notification Service
RABBITMQ_URL=amqp://localhost:5672
SERVICE_NAME=notifications-api
DATABASE_URL=postgres://...  # Own database
```

### Key Benefits of This Architecture

1. **Zero code changes to CommentService** - It just emits events
2. **Interface-based design** - Swap `InMemoryEventBus` → `RabbitMQEventBus`
3. **Independent scaling** - Scale notification service separately
4. **Fault tolerance** - Message queue provides durability
5. **Language agnostic** - Notification service could be in any language

---

## TypeScript Rules

### Strict Mode (all enabled)

- `noImplicitAny: true` - No implicit any types
- `strictNullChecks: true` - Explicit null handling
- `noUnusedLocals: true` - No unused variables
- `noUnusedParameters: true` - No unused parameters (use `_` prefix)
- `noImplicitReturns: true` - All paths must return

### Required Practices

```typescript
// ALWAYS: Explicit return types
async function findById(id: string): Promise<Comment | null> { }

// NEVER: Use 'any'
// BAD: function process(data: any) { }
// GOOD: function process(data: unknown) { }

// ALWAYS: Handle null/undefined explicitly
const comment = await repository.findById(id);
if (!comment) {
  throw new NotFoundError('Comment', id);
}

// ALWAYS: Use interfaces for DI
constructor(
  @inject(TYPES.CommentService)
  private readonly commentService: ICommentService  // Interface, not class
) {}
```

---

## Testing Standards

### Coverage Requirements

| Metric | Minimum |
|--------|---------|
| Branches | 83% |
| Functions | 85% |
| Lines | 85% |
| Statements | 85% |

### Test Structure (AAA Pattern)

```typescript
describe('CommentService', () => {
  let service: CommentService;
  let mockRepository: jest.Mocked<ICommentRepository>;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new CommentService(mockRepository);
  });

  describe('findById', () => {
    it('should return comment when found', async () => {
      // Arrange
      const mockComment = { id: '123', content: 'Test' };
      mockRepository.findById.mockResolvedValue(mockComment);

      // Act
      const result = await service.findById('123');

      // Assert
      expect(result).toEqual(mockComment);
      expect(mockRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundError when comment not found', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('123')).rejects.toThrow(NotFoundError);
    });
  });
});
```

### Integration Tests

```typescript
describe('Comments API', () => {
  let app: Application;

  beforeEach(() => {
    app = createApp();  // Fresh instance per test
  });

  it('should create a comment', async () => {
    const response = await request(app)
      .post('/api/v1/comments')
      .send({
        content: 'Test comment',
        authorId: '123e4567-e89b-12d3-a456-426614174000',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

---

## Code Style

### ESLint + Prettier Rules

| Rule | Value |
|------|-------|
| Indentation | 2 spaces |
| Quotes | Single quotes |
| Line length | 100 characters max |
| Trailing commas | ES5 style |
| Semicolons | Always |
| Arrow parens | Always |
| Line endings | LF (Unix) |

### Clean Code Limits

| Metric | Max |
|--------|-----|
| Lines per function | 50 |
| Cyclomatic complexity | 10 |
| Nesting depth | 3 |
| Function parameters | 4 |

---

## Git Commits

### Conventional Commits Format

```
<type>: <subject>

[optional body]
```

### Allowed Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting (no code change) |
| `refactor` | Code refactoring |
| `test` | Adding/updating tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |
| `build` | Build system changes |

### Rules

- Subject: max 72 characters
- Subject: lowercase, no period
- Body: wrap at 72 characters

### Examples

```
feat: add pagination support to comments endpoint

fix: resolve null pointer in comment service

test: add unit tests for validation middleware

chore: update dependencies
```

---

## Commands Reference

### Development

```bash
pnpm dev             # Start dev server with hot reload
pnpm build           # Compile TypeScript to dist/
pnpm start           # Run production server
```

### Testing

```bash
pnpm test            # Run all tests
pnpm test:watch      # Watch mode
pnpm test:coverage   # Generate coverage report
pnpm test:unit       # Unit tests only
pnpm test:integration # Integration tests only
```

### Code Quality

```bash
pnpm lint            # Run ESLint
pnpm lint:fix        # Fix ESLint issues
pnpm format          # Format with Prettier
pnpm format:check    # Check formatting
```

### Docker

```bash
pnpm docker:build    # Build image
pnpm docker:run      # Run container
pnpm docker:up       # Start with compose
pnpm docker:down     # Stop compose
pnpm docker:dev      # Development compose
```

---

## Rules for Claude

### DO

1. **Follow existing patterns** - Look at similar files before creating new ones
2. **Use interfaces** - All services and repositories must have interfaces
3. **Write tests first** - Or immediately after implementation
4. **Maintain coverage thresholds** - Run `pnpm test:coverage` to verify (83% branches, 85% others)
5. **Use Zod for validation** - All input must be validated
6. **Handle errors properly** - Controllers use try/catch → next()
7. **Use dependency injection** - Register in `container.ts`
8. **Add to types.ts** - New symbols for DI
9. **Follow naming conventions** - Check the tables above
10. **Run lint before commit** - `pnpm lint`

### DON'T

1. **Modify server.ts** - It's the entry point, keep it minimal
2. **Use `any` type** - Use `unknown` and type guards instead
3. **Skip interfaces** - They're required for DI and testing
4. **Ignore coverage** - Tests are mandatory
5. **Break existing tests** - Fix them if needed
6. **Use console.log** - Use proper logging (console.info/warn/error)
7. **Commit without linting** - Husky will reject it
8. **Skip validation** - All input must go through Zod
9. **Throw in repositories** - Return null instead
10. **Create files outside src/tests** - Unless configuration

### When Adding a New Feature

1. Create entity in `src/models/entities/`
2. Create DTOs in `src/models/dto/`
3. Create validator in `src/validators/`
4. Create repository interface in `src/repositories/interfaces/`
5. Create repository in `src/repositories/`
6. Create service interface in `src/services/interfaces/`
7. Create service in `src/services/`
8. Create controller in `src/controllers/`
9. Create routes in `src/routes/`
10. Register in `src/config/container.ts` and `src/config/types.ts`
11. Add routes to `src/app.ts`
12. Write tests mirroring the structure in `tests/`

---

## API Endpoints Reference

### Comments API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/comments` | List root comments (paginated) |
| GET | `/api/v1/comments/:id` | Get comment by ID |
| POST | `/api/v1/comments` | Create comment |
| PUT | `/api/v1/comments/:id` | Update comment |
| DELETE | `/api/v1/comments/:id` | Delete comment (cascade) |
| GET | `/api/v1/comments/:id/replies` | Get replies (paginated) |
| POST | `/api/v1/comments/:id/replies` | Create reply |
| GET | `/api-docs` | Swagger UI |

### Notifications API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications/user/:recipientId` | List user notifications |
| GET | `/api/v1/notifications/user/:recipientId/unread-count` | Get unread count |
| GET | `/api/v1/notifications/:id` | Get notification by ID |
| PATCH | `/api/v1/notifications/:id/read` | Mark as read |
| PATCH | `/api/v1/notifications/user/:recipientId/read-all` | Mark all as read |
| DELETE | `/api/v1/notifications/:id` | Delete notification |

### Query Parameters (GET /api/v1/comments)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page (max 100) |
| sortBy | string | createdAt | Sort field |
| sortOrder | asc/desc | desc | Sort direction |

### Query Parameters (GET /api/v1/notifications/user/:recipientId)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page (max 100) |
