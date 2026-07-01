import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  OCR_PROVIDER: z.enum(['stub', 'google-vision']).default('stub'),
  AI_PROVIDER: z.enum(['stub', 'claude']).default('stub'),
  NUTRITION_PROVIDER: z.enum(['stub', 'claude']).default('stub'),
  STORAGE_PROVIDER: z.enum(['local-disk', 's3']).default('local-disk'),
  GOOGLE_VISION_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
