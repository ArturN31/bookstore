import { z } from 'zod';

export interface ReviewInsert {
    id?: string;
    book_id: string;
    user_id: string;
    username: string;
    rating: number;
    review: string;
    created_at?: string;
    updated_at?: string;
}

export interface ReviewFormState {
    message?: string | null;
    error?: string | null;
    validationErrors?: z.core.$ZodIssue[];
}

export const INITIAL_EMPTY_STATE: ReviewFormState = {
    message: null,
    error: null,
    validationErrors: [],
};

export const REVIEW_ROUTES = {
    BOOK_PAGE: '/book/[id]',
    HOMEPAGE: '/',
} as const;
