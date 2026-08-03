import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata?: ArgumentMetadata) {
    // If pipe is called for non-body parameters (@Param, @Query, @CurrentUser), pass through untouched
    if (metadata?.type && metadata.type !== 'body') {
      return value;
    }
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed on request payload',
        errors: formattedErrors
      });
    }
    return result.data;
  }
}
