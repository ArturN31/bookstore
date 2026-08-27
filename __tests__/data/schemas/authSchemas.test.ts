import {
    passwordRules,
    passwordSchema,
    signInSchema,
    signUpSchema,
} from '@/data/schemas/authSchemas';

describe('authSchemas', () => {
    describe('passwordRules', () => {
        const validPassword = 'Password123!';

        it('should accept a valid password meeting all criteria', () => {
            const result = passwordRules.safeParse(validPassword);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(validPassword);
            }
        });

        it('should trim surrounding whitespace from password', () => {
            const result = passwordRules.safeParse(`  ${validPassword}  `);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(validPassword);
            }
        });

        it('should fail when password is less than 8 characters', () => {
            const result = passwordRules.safeParse('Pass1!');
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe(
                    'Password must be at least 8 characters long',
                );
            }
        });

        it('should fail when password exceeds 50 characters', () => {
            const longPassword = 'P1!' + 'a'.repeat(48);
            const result = passwordRules.safeParse(longPassword);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe(
                    'Password cannot be longer than 50 characters',
                );
            }
        });

        it('should fail when missing an uppercase letter', () => {
            const result = passwordRules.safeParse('password123!');
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Must include an uppercase letter');
            }
        });

        it('should fail when missing a lowercase letter', () => {
            const result = passwordRules.safeParse('PASSWORD123!');
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Must include a lowercase letter');
            }
        });

        it('should fail when missing a number', () => {
            const result = passwordRules.safeParse('Password!');
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Must include a number');
            }
        });

        it('should fail when missing a special character', () => {
            const result = passwordRules.safeParse('Password123');
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Must include a special character');
            }
        });
    });

    describe('passwordSchema', () => {
        it('should pass when password and cnfPassword match', () => {
            const payload = {
                password: 'Password123!',
                cnfPassword: 'Password123!',
            };
            const result = passwordSchema.safeParse(payload);
            expect(result.success).toBe(true);
        });

        it('should fail when passwords do not match', () => {
            const payload = {
                password: 'Password123!',
                cnfPassword: 'DifferentPassword123!',
            };
            const result = passwordSchema.safeParse(payload);
            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('cnfPassword'));
                expect(issue?.message).toBe('Passwords must match');
            }
        });

        it('should fail if password does not meet passwordRules requirements', () => {
            const payload = {
                password: 'weak',
                cnfPassword: 'weak',
            };
            const result = passwordSchema.safeParse(payload);
            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('password'));
                expect(issue).toBeDefined();
            }
        });
    });

    describe('signInSchema', () => {
        it('should pass for valid email and password', () => {
            const payload = {
                email: 'test@example.com',
                password: 'somepassword',
            };
            const result = signInSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('test@example.com');
            }
        });

        it('should trim and convert email to lowercase', () => {
            const payload = {
                email: '  TEST.User@EXAMPLE.COM  ',
                password: 'somepassword',
            };
            const result = signInSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('test.user@example.com');
            }
        });

        it('should fail when email is empty', () => {
            const payload = {
                email: '   ',
                password: 'somepassword',
            };
            const result = signInSchema.safeParse(payload);
            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('email'));
                expect(issue?.message).toBe('Email is required');
            }
        });

        it('should fail when email format is invalid', () => {
            const payload = {
                email: 'invalid-email-format',
                password: 'somepassword',
            };
            const result = signInSchema.safeParse(payload);
            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('email'));
                expect(issue?.message).toBe('Invalid email format');
            }
        });

        it('should fail when password is empty', () => {
            const payload = {
                email: 'test@example.com',
                password: '',
            };
            const result = signInSchema.safeParse(payload);
            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('password'));
                expect(issue?.message).toBe('Password is required');
            }
        });
    });

    describe('signUpSchema', () => {
        it('should pass with valid email, password, and matching cnfPassword', () => {
            const payload = {
                email: '  NewUser@EXAMPLE.COM ',
                password: 'Password123!',
                cnfPassword: 'Password123!',
            };
            const result = signUpSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('newuser@example.com');
                expect(result.data.password).toBe('Password123!');
            }
        });

        it('should fail when cnfPassword is empty', () => {
            const payload = {
                email: 'test@example.com',
                password: 'Password123!',
                cnfPassword: '   ',
            };
            const result = signUpSchema.safeParse(payload);
            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('cnfPassword'));
                expect(issue?.message).toBe('Please confirm your password');
            }
        });

        it('should fail when password and cnfPassword do not match', () => {
            const payload = {
                email: 'test@example.com',
                password: 'Password123!',
                cnfPassword: 'DifferentPassword123!',
            };
            const result = signUpSchema.safeParse(payload);
            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('cnfPassword'));
                expect(issue?.message).toBe('Passwords must match');
            }
        });

        it('should collect multiple validation errors when email and password rules fail simultaneously', () => {
            const payload = {
                email: 'not-an-email',
                password: 'weak',
                cnfPassword: 'weak',
            };
            const result = signUpSchema.safeParse(payload);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
            }
        });
    });
});
