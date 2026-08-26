import { z } from 'zod';

export const passwordRules = z
    .string()
    .trim()
    .min(8, 'Password must be at least 8 characters long')
    .max(50, 'Password cannot be longer than 50 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[a-z]/, 'Must include a lowercase letter')
    .regex(/\d/, 'Must include a number')
    .regex(/[@$!%*?&]/, 'Must include a special character');

export const passwordSchema = z
    .object({
        password: passwordRules,
        cnfPassword: z.string().trim(),
    })
    .refine((data) => data.password === data.cnfPassword, {
        message: 'Passwords must match',
        path: ['cnfPassword'],
    });

export const signInSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, 'Email is required')
        .pipe(z.email('Invalid email format'))
        .transform((val) => val.toLowerCase()),
    password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z
    .object({
        email: z
            .string()
            .trim()
            .min(1, 'Email is required')
            .pipe(z.email('Invalid email format'))
            .transform((val) => val.toLowerCase()),
        password: passwordRules,
        cnfPassword: z.string().trim().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.cnfPassword, {
        message: 'Passwords must match',
        path: ['cnfPassword'],
    });
