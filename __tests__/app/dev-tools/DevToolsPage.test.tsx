import DevToolsPage from '@/app/dev-tools/page';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { verifyRateLimit } from '@/utils/network/rateLimiter';

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

jest.mock('@/utils/network/getAppClientIp', () => ({
    getAppClientIp: jest.fn().mockResolvedValue('203.0.113.1'),
}));

jest.mock('@/utils/network/rateLimiter', () => ({
    limiters: { search: {} },
    verifyRateLimit: jest.fn(),
}));

jest.mock('@/app/dev-tools/components/ConsoleSection', () => ({
    ConsoleSection: ({ title, children }: { title: string; children: React.ReactNode }) => (
        <div
            data-testid="console-section"
            data-title={title}
        >
            {children}
        </div>
    ),
}));

jest.mock('@/app/dev-tools/components/LiveTelemetry/LiveTelemetry', () => ({
    LiveTelemetry: () => <div data-testid="live-telemetry" />,
}));

jest.mock('@/app/dev-tools/components/SystemLog/SystemLog', () => ({
    SystemLog: () => <div data-testid="system-log" />,
}));

jest.mock('@/app/dev-tools/components/DatabaseActions/DatabaseActions', () => ({
    DatabaseActions: () => <div data-testid="database-actions" />,
}));

jest.mock('@/app/dev-tools/components/UserRegistry/UserRegistry', () => ({
    UserRegistry: () => <div data-testid="user-registry" />,
}));

describe('DevToolsPage', () => {
    const mockVerifyRateLimit = jest.mocked(verifyRateLimit);
    const originalNodeEnv = process.env.NODE_ENV;
    const originalForceProduction = process.env.FORCE_PRODUCTION;
    const env = process.env as Record<string, string | undefined>;

    beforeEach(() => {
        jest.clearAllMocks();
        env.NODE_ENV = 'development';
        delete env.FORCE_PRODUCTION;
        mockVerifyRateLimit.mockResolvedValue({
            success: true,
            limit: 60,
            remaining: 59,
            reset: Date.now() + 60000,
        });
    });

    afterAll(() => {
        env.NODE_ENV = originalNodeEnv;
        if (originalForceProduction === undefined) delete env.FORCE_PRODUCTION;
        else env.FORCE_PRODUCTION = originalForceProduction;
    });

    it('should redirect to "/" if NODE_ENV is production', async () => {
        env.NODE_ENV = 'production';

        await DevToolsPage();
        expect(redirect).toHaveBeenCalledWith('/');
    });

    it('should redirect when FORCE_PRODUCTION is enabled', async () => {
        env.FORCE_PRODUCTION = 'true';

        await DevToolsPage();

        expect(redirect).toHaveBeenCalledWith('/');
        expect(mockVerifyRateLimit).not.toHaveBeenCalled();
    });

    it('should render the system console dashboard correctly when not in production', async () => {
        const jsx = await DevToolsPage();
        render(jsx);

        expect(screen.getByText('System Console')).toBeInTheDocument();
        expect(
            screen.getByText('Orchestrator // Local Development Environment'),
        ).toBeInTheDocument();
        expect(screen.getByText('Supabase Admin Engine // Status: Active')).toBeInTheDocument();

        expect(screen.getByTestId('system-log')).toBeInTheDocument();
        expect(screen.getByTestId('live-telemetry')).toBeInTheDocument();
        expect(screen.getByTestId('database-actions')).toBeInTheDocument();
        expect(screen.getByTestId('user-registry')).toBeInTheDocument();
    });

    it('should stop before rendering privileged tools when rate limited', async () => {
        mockVerifyRateLimit.mockResolvedValueOnce({
            success: false,
            limit: 60,
            remaining: 0,
            reset: Date.now() + 60000,
        });

        const jsx = await DevToolsPage();
        render(jsx);

        expect(screen.getByText('Please Try Again Later')).toBeInTheDocument();
        expect(screen.getByText('Too many development console requests.')).toBeInTheDocument();
        expect(screen.queryByTestId('user-registry')).not.toBeInTheDocument();
    });
});
