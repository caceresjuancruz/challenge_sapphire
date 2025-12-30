import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Comments API',
    version: '1.0.0',
    description: 'API REST para gestión de comentarios con arquitectura en capas',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  tags: [
    {
      name: 'Comments',
      description: 'Operaciones CRUD de comentarios',
    },
    {
      name: 'Health',
      description: 'Health check endpoint',
    },
  ],
  components: {
    schemas: {
      Comment: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Identificador único del comentario',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          content: {
            type: 'string',
            description: 'Contenido del comentario',
            example: 'Este es un comentario de ejemplo',
          },
          authorId: {
            type: 'string',
            format: 'uuid',
            description: 'ID del autor del comentario',
            example: '550e8400-e29b-41d4-a716-446655440001',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación',
            example: '2024-12-18T10:30:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de última actualización',
            example: '2024-12-18T10:30:00.000Z',
          },
        },
      },
      CreateCommentDto: {
        type: 'object',
        required: ['content', 'authorId'],
        properties: {
          content: {
            type: 'string',
            minLength: 1,
            maxLength: 5000,
            description: 'Contenido del comentario',
            example: 'Este es un nuevo comentario',
          },
          authorId: {
            type: 'string',
            format: 'uuid',
            description: 'ID del autor',
            example: '550e8400-e29b-41d4-a716-446655440001',
          },
        },
      },
      UpdateCommentDto: {
        type: 'object',
        required: ['content'],
        properties: {
          content: {
            type: 'string',
            minLength: 1,
            maxLength: 5000,
            description: 'Nuevo contenido del comentario',
            example: 'Comentario actualizado',
          },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            oneOf: [
              { $ref: '#/components/schemas/Comment' },
              {
                type: 'array',
                items: { $ref: '#/components/schemas/Comment' },
              },
            ],
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Comment with id xxx not found',
              },
              code: {
                type: 'string',
                example: 'NOT_FOUND',
              },
              statusCode: {
                type: 'integer',
                example: 404,
              },
            },
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          path: {
            type: 'string',
            example: '/api/v1/comments/xxx',
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          total: {
            type: 'integer',
            description: 'Total de items',
            example: 150,
          },
          page: {
            type: 'integer',
            description: 'Página actual',
            example: 1,
          },
          limit: {
            type: 'integer',
            description: 'Items por página',
            example: 10,
          },
          totalPages: {
            type: 'integer',
            description: 'Total de páginas',
            example: 15,
          },
          hasNextPage: {
            type: 'boolean',
            description: 'Si hay página siguiente',
            example: true,
          },
          hasPrevPage: {
            type: 'boolean',
            description: 'Si hay página anterior',
            example: false,
          },
        },
      },
      PaginatedCommentResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Comment' },
          },
          meta: {
            $ref: '#/components/schemas/PaginationMeta',
          },
        },
      },
    },
  },
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
