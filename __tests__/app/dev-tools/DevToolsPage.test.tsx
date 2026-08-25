import DevToolsPage from '@/app/dev-tools/page';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
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
    const originalNodeEnv = process.env.NODE_ENV;
    const env = process.env as Record<string, string | undefined>;

    beforeEach(() => {
        jest.clearAllMocks();
        env.NODE_ENV = 'development';
    });

    afterAll(() => {
        env.NODE_ENV = originalNodeEnv;
    });

    it('should redirect to "/" if NODE_ENV is production', async () => {
        env.NODE_ENV = 'production';

        await DevToolsPage();
        expect(redirect).toHaveBeenCalledWith('/');
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
});
