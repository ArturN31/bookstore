import '@testing-library/jest-dom';
import { TextEncoder } from 'util';

global.TextEncoder = TextEncoder;

process.env.NEXT_PUBLIC_SUPABASE_DB_URL =
    process.env.NEXT_PUBLIC_SUPABASE_DB_URL || 'https://mock-project.supabase.co';

process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY || 'mock-anon-key-placeholder';

process.env.SUPABASE_SECRET_KEY =
    process.env.SUPABASE_SECRET_KEY || 'mock-service-role-key-placeholder';

jest.mock('@supabase/supabase-js', () => {
    return {
        createClient: jest.fn(() => ({
            from: jest.fn(() => ({
                select: jest.fn().mockResolvedValue({ data: [{ id: 1, name: 'Test Item' }], error: null }),
                insert: jest.fn().mockResolvedValue({ data: null, error: null }),
            })),
            auth: {
                getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
                getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
            },
        })),
    };
});