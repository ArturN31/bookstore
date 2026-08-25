import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { TextDecoder, TextEncoder } from 'util';

// 1. Node.js / Web Standards Polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;

process.env.NEXT_PUBLIC_SUPABASE_DB_URL =
    process.env.NEXT_PUBLIC_SUPABASE_DB_URL || 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY || 'mock-key';
process.env.SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'mock-secret';

// 2. Global Framework Noise & Expected Test Error Suppressor
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = (...args: unknown[]) => {
        const message = args[0];
        if (
            typeof message === 'string' &&
            (message.includes('A suspended resource finished loading inside a test') ||
                message.includes('pingSuspendedRoot') ||
                message.includes('[DevTools] Command'))
        ) {
            return;
        }
        originalConsoleError(...args);
    };
});

afterAll(() => {
    console.error = originalConsoleError;
});

// 3. Teardown: Flush microtasks, macrotasks, and unmount components safely
afterEach(async () => {
    // Flush microtasks
    await new Promise<void>((resolve) => {
        process.nextTick(resolve);
    });
    // Flush macrotasks (allows pending suspense promises to settle)
    await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
    });
    cleanup();
});

// 4. Supabase SDK Mock
jest.mock('@supabase/supabase-js', () => {
    return {
        createClient: jest.fn(() => ({
            from: jest.fn(() => ({
                select: jest
                    .fn()
                    .mockResolvedValue({ data: [{ id: 1, name: 'Test Item' }], error: null }),
                insert: jest.fn().mockResolvedValue({ data: null, error: null }),
                update: jest.fn().mockResolvedValue({ data: null, error: null }),
                delete: jest.fn().mockResolvedValue({ data: null, error: null }),
            })),
            auth: {
                getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
                getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
                onAuthStateChange: jest.fn(() => ({
                    data: { subscription: { unsubscribe: jest.fn() } },
                })),
            },
        })),
    };
});

// 5. Next.js App Router Mocks
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    useServerInsertedHTML: jest.fn((callback: () => unknown) => callback?.()),
}));

// 6. JSDOM Polyfills (Guarded)
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });

    class MockIntersectionObserver implements IntersectionObserver {
        readonly root: Element | Document | null = null;
        readonly rootMargin: string = '';
        readonly scrollMargin: string = '';
        readonly thresholds: ReadonlyArray<number> = [];
        disconnect = jest.fn();
        observe = jest.fn();
        takeRecords = jest.fn(() => []);
        unobserve = jest.fn();
    }
    Object.defineProperty(window, 'IntersectionObserver', {
        writable: true,
        configurable: true,
        value: MockIntersectionObserver,
    });

    class MockResizeObserver implements ResizeObserver {
        disconnect = jest.fn();
        observe = jest.fn();
        unobserve = jest.fn();
    }
    Object.defineProperty(window, 'ResizeObserver', {
        writable: true,
        configurable: true,
        value: MockResizeObserver,
    });
    Object.defineProperty(window, 'scrollTo', { writable: true, value: jest.fn() });
}
