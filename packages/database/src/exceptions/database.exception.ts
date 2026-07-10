/**
 * Base database exception
 */
export class DatabaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = "DatabaseError";
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

/**
 * Entity not found exception
 */
export class EntityNotFoundError extends DatabaseError {
  constructor(entity: string, id: string) {
    super(`${entity} with id '${id}' not found`);
    this.name = "EntityNotFoundError";
  }
}

/**
 * Validation error exception
 */
export class ValidationError extends DatabaseError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Constraint violation exception
 */
export class ConstraintViolationError extends DatabaseError {
  constructor(message: string, public constraint?: string) {
    super(message);
    this.name = "ConstraintViolationError";
  }
}