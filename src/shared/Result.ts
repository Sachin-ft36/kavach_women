export type AppErrorType =
  | 'NETWORK_ERROR'
  | 'PERMISSION_DENIED'
  | 'SECURITY_ERROR'
  | 'PERSISTENCE_ERROR'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNEXPECTED';

export class AppError {
  constructor(
    public readonly type: AppErrorType,
    public readonly message: string,
    public readonly originalError?: any
  ) {}
}

export class Result<T> {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly value?: T,
    public readonly error?: AppError
  ) {}

  public static success<T>(value: T): Result<T> {
    return new Result<T>(true, value, undefined);
  }

  public static failure<T>(error: AppError): Result<T> {
    return new Result<T>(false, undefined, error);
  }

  public getValueOrThrow(): T {
    if (!this.isSuccess) {
      throw new Error(`[Result] Cannot retrieve value from Failure: ${this.error?.message}`);
    }
    return this.value!;
  }
}
