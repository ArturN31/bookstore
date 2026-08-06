export class NextResponse {
    public static next(): {
        cookies: {
            set: (name: string, value: string, options?: Record<string, unknown>) => void;
            get: (name: string) => { name: string; value: string } | undefined;
        };
    } {
        return {
            cookies: {
                set: (): void => {},
                get: (): undefined => undefined,
            },
        };
    }

    public static redirect(): Response {
        return {} as unknown as Response;
    }
}

export class NextRequest {
    public url: string;
    public headers: Headers;

    constructor(input: string | URL, init?: RequestInit) {
        this.url = typeof input === 'string' ? input : input.toString();
        this.headers = new Headers(init?.headers);
    }
}

export const after = (callback: () => void | Promise<void>): void => {
    void callback();
};
