import { addressSchema, fullUserSchema } from '@/data/schemas/onboardingSchema';

describe('onboardingSchema', () => {
    const getRelativeDateString = (
        yearsOffset: number,
        monthsOffset = 0,
        daysOffset = 0,
    ): string => {
        const date = new Date();
        date.setFullYear(date.getFullYear() + yearsOffset);
        date.setMonth(date.getMonth() + monthsOffset);
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString().split('T')[0];
    };

    const validAddressInput = {
        streetAddress: '123 High Street',
        postcode: 'EH1 1AA',
        city: 'Edinburgh',
        country: 'United Kingdom',
    };

    const validFullUserInput = {
        ...validAddressInput,
        firstName: 'Jane',
        lastName: 'Doe',
        username: 'janedoe_99',
        dob: getRelativeDateString(-25),
        phoneNumber: '+44 7123 456789',
    };

    describe('addressSchema', () => {
        it('should pass with valid address details', () => {
            const result = addressSchema.safeParse(validAddressInput);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validAddressInput);
            }
        });

        describe('streetAddress field', () => {
            it('should strip HTML tags and trim whitespace', () => {
                const payload = {
                    ...validAddressInput,
                    streetAddress: '  <script>alert("xss")</script>123 Main St  ',
                };
                const result = addressSchema.safeParse(payload);
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.streetAddress).toBe('alert("xss")123 Main St');
                }
            });

            it('should fail if street address is less than 5 characters after sanitization', () => {
                const payload = { ...validAddressInput, streetAddress: '  <b>123</b> ' };
                const result = addressSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('streetAddress'));
                    expect(issue?.message).toBe(
                        'Please enter a full street address (at least 5 characters)',
                    );
                }
            });

            it('should fail if street address exceeds 100 characters', () => {
                const payload = { ...validAddressInput, streetAddress: 'A'.repeat(101) };
                const result = addressSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('streetAddress'));
                    expect(issue?.message).toBe('Street address is too long (max 100 characters)');
                }
            });
        });

        describe('postcode field', () => {
            it('should convert postcode to uppercase and trim whitespace', () => {
                const payload = { ...validAddressInput, postcode: '  g1 1ab  ' };
                const result = addressSchema.safeParse(payload);
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.postcode).toBe('G1 1AB');
                }
            });

            it('should fail if postcode is empty', () => {
                const payload = { ...validAddressInput, postcode: '   ' };
                const result = addressSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('postcode'));
                    expect(issue?.message).toBe('Postcode is required');
                }
            });

            it('should fail if postcode contains invalid characters or wrong length', () => {
                const payload = { ...validAddressInput, postcode: 'G1-1AB@#' };
                const result = addressSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('postcode'));
                    expect(issue?.message).toBe('Postcode must be 3-10 alphanumeric characters');
                }
            });
        });

        describe('city field', () => {
            it('should sanitize HTML and accept valid city names with accents, hyphens, and apostrophes', () => {
                const payload = {
                    ...validAddressInput,
                    city: "  <h1>St. John's-on-Sea</h1>  ",
                };
                const result = addressSchema.safeParse(payload);
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.city).toBe("St. John's-on-Sea");
                }
            });

            it('should fail if city name is shorter than 2 characters', () => {
                const payload = { ...validAddressInput, city: 'A' };
                const result = addressSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('city'));
                    expect(issue?.message).toBe('City name must be at least 2 characters');
                }
            });

            it('should fail if city name exceeds 50 characters', () => {
                const payload = { ...validAddressInput, city: 'C'.repeat(51) };
                const result = addressSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('city'));
                    expect(issue?.message).toBe('City name cannot exceed 50 characters');
                }
            });

            it('should fail if city name contains numbers or illegal characters', () => {
                const payload = { ...validAddressInput, city: 'London123' };
                const result = addressSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('city'));
                    expect(issue?.message).toBe('City name contains invalid characters');
                }
            });
        });

        describe('country field', () => {
            it('should sanitize HTML and validate country name length', () => {
                const payload = { ...validAddressInput, country: ' <div>France</div> ' };
                const result = addressSchema.safeParse(payload);
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.country).toBe('France');
                }
            });

            it('should fail when country is empty', () => {
                const payload = { ...validAddressInput, country: '  ' };
                const result = addressSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('country'));
                    expect(issue?.message).toBe('Please select a country');
                }
            });

            it('should fail when country name exceeds 50 characters', () => {
                const payload = { ...validAddressInput, country: 'N'.repeat(51) };
                const result = addressSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('country'));
                    expect(issue?.message).toBe('Country name is too long');
                }
            });
        });
    });

    describe('fullUserSchema', () => {
        it('should pass with valid user details', () => {
            const result = fullUserSchema.safeParse(validFullUserInput);
            expect(result.success).toBe(true);
        });

        describe('firstName and lastName fields', () => {
            it('should sanitize HTML and trim names', () => {
                const payload = {
                    ...validFullUserInput,
                    firstName: ' <span>John</span> ',
                    lastName: " <p>O'Connor-Smith</p> ",
                };
                const result = fullUserSchema.safeParse(payload);
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.firstName).toBe('John');
                    expect(result.data.lastName).toBe("O'Connor-Smith");
                }
            });

            it('should fail if firstName contains invalid characters', () => {
                const payload = { ...validFullUserInput, firstName: 'John123' };
                const result = fullUserSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('firstName'));
                    expect(issue?.message).toBe('First name contains invalid characters');
                }
            });

            it('should fail if lastName is under 2 characters', () => {
                const payload = { ...validFullUserInput, lastName: 'A' };
                const result = fullUserSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('lastName'));
                    expect(issue?.message).toBe('Last name must be at least 2 characters');
                }
            });
        });

        describe('username field', () => {
            it('should trim and transform username to lowercase', () => {
                const payload = { ...validFullUserInput, username: '  User_NAME_99  ' };
                const result = fullUserSchema.safeParse(payload);
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.username).toBe('user_name_99');
                }
            });

            it('should fail if username is shorter than 3 characters', () => {
                const payload = { ...validFullUserInput, username: 'ab' };
                const result = fullUserSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('username'));
                    expect(issue?.message).toBe('Username must be at least 3 characters long');
                }
            });

            it('should fail if username contains spaces or special characters', () => {
                const payload = { ...validFullUserInput, username: 'user-name!' };
                const result = fullUserSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('username'));
                    expect(issue?.message).toBe(
                        'Username can only contain letters, numbers, and underscores',
                    );
                }
            });
        });

        describe('dob (Date of Birth) field', () => {
            it('should pass for a user exactly 18 years old today', () => {
                const payload = {
                    ...validFullUserInput,
                    dob: getRelativeDateString(-18),
                };
                const result = fullUserSchema.safeParse(payload);
                expect(result.success).toBe(true);
            });

            it('should fail when dob string is empty', () => {
                const payload = { ...validFullUserInput, dob: '   ' };
                const result = fullUserSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('dob'));
                    expect(issue?.message).toBe('Date of birth is required');
                }
            });

            it('should fail for an invalid date string', () => {
                const payload = { ...validFullUserInput, dob: 'not-a-valid-date' };
                const result = fullUserSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('dob'));
                    expect(issue?.message).toBe('Please enter a valid date');
                }
            });

            it('should fail for a date in the future', () => {
                const payload = {
                    ...validFullUserInput,
                    dob: getRelativeDateString(1),
                };
                const result = fullUserSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('dob'));
                    expect(issue?.message).toBe('Date of birth cannot be in the future');
                }
            });

            it('should fail for a user who turns 18 tomorrow (under 18 years old)', () => {
                const payload = {
                    ...validFullUserInput,
                    dob: getRelativeDateString(-18, 0, 1),
                };
                const result = fullUserSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('dob'));
                    expect(issue?.message).toBe('You must be at least 18 years old');
                }
            });

            it('should fail for a user older than 120 years', () => {
                const payload = {
                    ...validFullUserInput,
                    dob: getRelativeDateString(-121),
                };
                const result = fullUserSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('dob'));
                    expect(issue?.message).toBe('Please enter a valid birth year');
                }
            });
        });

        describe('phoneNumber field', () => {
            it.each(['+1 123 456 7890', '07123456789', '123-456-7890', '+447123456789'])(
                'should pass for valid phone number format: %s',
                (phoneNumber) => {
                    const payload = { ...validFullUserInput, phoneNumber };
                    const result = fullUserSchema.safeParse(payload);
                    expect(result.success).toBe(true);
                },
            );

            it('should fail when phone number is empty', () => {
                const payload = { ...validFullUserInput, phoneNumber: '   ' };
                const result = fullUserSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('phoneNumber'));
                    expect(issue?.message).toBe('Phone number is required');
                }
            });

            it('should fail when phone number contains invalid characters or is too short', () => {
                const payload = { ...validFullUserInput, phoneNumber: '12345' };
                const result = fullUserSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('phoneNumber'));
                    expect(issue?.message).toBe(
                        'Invalid format. Examples: +1 123 456 7890 or 07123456789',
                    );
                }
            });
        });
    });
});
