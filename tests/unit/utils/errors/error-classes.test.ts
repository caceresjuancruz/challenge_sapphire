import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
  ErrorCode,
} from '../../../../src/utils/errors';

describe('Error Classes Static Methods', () => {
  describe('BadRequestError', () => {
    it('should create error with message', () => {
      const error = new BadRequestError('Invalid request');

      expect(error.message).toBe('Invalid request');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.BAD_REQUEST);
    });

    it('should create error with context', () => {
      const error = new BadRequestError('Invalid request', { field: 'name' });

      expect(error.context).toEqual({ field: 'name' });
    });

    describe('missingField', () => {
      it('should create error for missing field', () => {
        const error = BadRequestError.missingField('username');

        expect(error.message).toBe('Missing required field: username');
        expect(error.context).toEqual({ field: 'username' });
      });
    });

    describe('invalidField', () => {
      it('should create error for invalid field', () => {
        const error = BadRequestError.invalidField('email', 'must be a valid email');

        expect(error.message).toBe('Invalid email: must be a valid email');
        expect(error.context).toEqual({ field: 'email', reason: 'must be a valid email' });
      });
    });
  });

  describe('ConflictError', () => {
    it('should create error with message', () => {
      const error = new ConflictError('Resource conflict');

      expect(error.message).toBe('Resource conflict');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe(ErrorCode.CONFLICT);
    });

    it('should create error with resource and field context', () => {
      const error = new ConflictError('User already exists', 'User', 'email', 'test@example.com');

      expect(error.context).toEqual({
        resource: 'User',
        field: 'email',
        value: 'test@example.com',
      });
    });

    describe('duplicate', () => {
      it('should create duplicate error with value', () => {
        const error = ConflictError.duplicate('User', 'email', 'test@example.com');

        expect(error.message).toBe("User with email 'test@example.com' already exists");
        expect(error.context).toEqual({
          resource: 'User',
          field: 'email',
          value: 'test@example.com',
        });
      });
    });
  });

  describe('ForbiddenError', () => {
    it('should create error with default message', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should create error with custom message', () => {
      const error = new ForbiddenError('Custom forbidden message');

      expect(error.message).toBe('Custom forbidden message');
    });

    it('should create error with resource and action context', () => {
      const error = new ForbiddenError('Cannot delete', 'Comment', 'delete');

      expect(error.context).toEqual({
        resource: 'Comment',
        action: 'delete',
      });
    });

    describe('forResource', () => {
      it('should create error for resource with default access action', () => {
        const error = ForbiddenError.forResource('Comment');

        expect(error.message).toBe('You do not have permission to access this Comment');
        expect(error.context).toEqual({
          resource: 'Comment',
          action: 'access',
        });
      });

      it('should create error for resource with custom action', () => {
        const error = ForbiddenError.forResource('Comment', 'delete');

        expect(error.message).toBe('You do not have permission to delete this Comment');
        expect(error.context).toEqual({
          resource: 'Comment',
          action: 'delete',
        });
      });
    });
  });

  describe('UnauthorizedError', () => {
    it('should create error with default message', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
    });

    it('should create error with custom message', () => {
      const error = new UnauthorizedError('Session expired');

      expect(error.message).toBe('Session expired');
    });

    describe('invalidCredentials', () => {
      it('should create error for invalid credentials', () => {
        const error = UnauthorizedError.invalidCredentials();

        expect(error.message).toBe('Invalid credentials');
      });
    });

    describe('tokenExpired', () => {
      it('should create error for expired token', () => {
        const error = UnauthorizedError.tokenExpired();

        expect(error.message).toBe('Token has expired');
      });
    });

    describe('invalidToken', () => {
      it('should create error for invalid token', () => {
        const error = UnauthorizedError.invalidToken();

        expect(error.message).toBe('Invalid or malformed token');
      });
    });
  });

  describe('ValidationError', () => {
    it('should create error with issues array', () => {
      const issues = [
        { field: 'email', message: 'Invalid format' },
        { field: 'password', message: 'Too short' },
      ];
      const error = new ValidationError(issues);

      expect(error.message).toBe('email: Invalid format, password: Too short');
      expect(error.issues).toEqual(issues);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should use custom message when provided', () => {
      const error = new ValidationError(
        [{ field: 'email', message: 'Invalid' }],
        'Custom validation message'
      );

      expect(error.message).toBe('Custom validation message');
    });

    it('should include context with issues and fields', () => {
      const issues = [{ field: 'email', message: 'Invalid' }];
      const error = new ValidationError(issues);

      expect(error.context).toEqual({
        issues,
        fields: ['email'],
      });
    });

    describe('fromField', () => {
      it('should create error from single field', () => {
        const error = ValidationError.fromField('email', 'Invalid email format', 'bad-email');

        expect(error.message).toBe('email: Invalid email format');
        expect(error.issues).toEqual([
          {
            field: 'email',
            message: 'Invalid email format',
            value: 'bad-email',
          },
        ]);
      });

      it('should create error from field without value', () => {
        const error = ValidationError.fromField('email', 'Required');

        expect(error.issues).toEqual([
          {
            field: 'email',
            message: 'Required',
            value: undefined,
          },
        ]);
      });
    });
  });
});
