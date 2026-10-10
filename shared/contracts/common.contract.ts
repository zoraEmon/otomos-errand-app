import { z } from 'zod';

export const Code7Schema = z
  .string()
  .length(7, 'code7 must be exactly 7 characters')
  .regex(/^[a-z0-9]+$/i, 'code7 must be alphanumeric');

export const UuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}