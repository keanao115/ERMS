import { describe, it, expect } from 'vitest';
import { ZodValidationPipe } from './zod-validation.pipe';
import { CancelOrderSchema } from '@erms/shared';
import { BadRequestException } from '@nestjs/common';

describe('ZodValidationPipe Unit Tests', () => {
  const zodPipe = new ZodValidationPipe(CancelOrderSchema);

  it('passes non-body parameters (e.g. @Param id string) through untouched', () => {
    const result = zodPipe.transform('order-123', { type: 'param', metatype: String });
    expect(result).toBe('order-123');
  });

  it('validates body parameters correctly when reason is provided', () => {
    const result = zodPipe.transform({ reason: 'Guest walked out' }, { type: 'body', metatype: Object });
    expect(result).toEqual({ reason: 'Guest walked out' });
  });

  it('rejects empty or whitespace-only reason with BadRequestException 400', () => {
    expect(() => zodPipe.transform({ reason: '   ' }, { type: 'body', metatype: Object })).toThrow(BadRequestException);
  });
});
