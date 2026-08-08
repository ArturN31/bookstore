import z from 'zod';

export type ChangeUsernameFormState = {
    username?: string | null;
    validationErrors?: z.core.$ZodIssue[];
    message?: string | null;
    isUsernameTaken?: boolean;
};

export const INITIAL_STATE: ChangeUsernameFormState = {
    username: '',
    message: null,
    isUsernameTaken: false,
};
