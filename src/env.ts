require('dotenv').config();

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),

  PUSHOVER_TOKEN: z.string().min(1).optional(),
  PUSHOVER_USER: z.string().min(1).optional(),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
});

const env = envSchema.parse(process.env);

export default env;
