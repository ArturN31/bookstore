import { render, screen, fireEvent } from '@testing-library/react';
import { SystemLog } from '@/app/dev-tools/components/SystemLog/SystemLog';
import * as useSystemLogic from '@/app/dev-tools/components/SystemLog/useSystemLogic';

interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: 'error' | 'success' | 'warning' | 'system' | 'info';
}

jest.mock('@/app/dev-tools/components/SystemLog/useSystemLogic', () => ({
    useSystemLog: jest.fn(() => []),
    clearSysLog: jest.fn(),
}));

describe('SystemLog', () => {
    const mockScrollIntoView = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    });

    it('should render SystemLog component', () => {
        render(<SystemLog />);

        expect(screen.getByText(/Console_v4.0.1/i)).toBeInTheDocument();
        expect(screen.getByText('[ Clear_Buffer ]')).toBeInTheDocument();
    });

    it('should display line count', () => {
        (useSystemLogic.useSystemLog as jest.Mock).mockReturnValue([]);

        render(<SystemLog />);

        expect(screen.getByText('LN: 00')).toBeInTheDocument();
    });

    it('should display correct line count when logs exist', () => {
        const mockLogs: LogEntry[] = [
            { id: '1', timestamp: '10:00:00', message: 'Test', type: 'info' },
            { id: '2', timestamp: '10:00:01', message: 'Test 2', type: 'info' },
        ];
        (useSystemLogic.useSystemLog as jest.Mock).mockReturnValue(mockLogs);

        render(<SystemLog />);

        expect(screen.getByText('LN: 02')).toBeInTheDocument();
    });

    it('should show idle message when no logs', () => {
        (useSystemLogic.useSystemLog as jest.Mock).mockReturnValue([]);

        render(<SystemLog />);

        expect(screen.getByText(/KERNEL: SYSTEM_IDLE/i)).toBeInTheDocument();
    });

    it('should not show idle message when logs exist', () => {
        const mockLogs: LogEntry[] = [
            { id: '1', timestamp: '10:00:00', message: 'Test', type: 'info' },
        ];
        (useSystemLogic.useSystemLog as jest.Mock).mockReturnValue(mockLogs);

        render(<SystemLog />);

        expect(screen.queryByText(/KERNEL: SYSTEM_IDLE/i)).not.toBeInTheDocument();
    });

    it('should render log entries', () => {
        const mockLogs: LogEntry[] = [
            { id: '1', timestamp: '10:00:00', message: 'Test message', type: 'info' },
        ];
        (useSystemLogic.useSystemLog as jest.Mock).mockReturnValue(mockLogs);

        render(<SystemLog />);

        expect(screen.getByText('Test message')).toBeInTheDocument();
        expect(screen.getByText('[10:00:00]')).toBeInTheDocument();
    });

    it('should render error log with correct styling', () => {
        const mockLogs: LogEntry[] = [
            { id: '1', timestamp: '10:00:00', message: 'Error occurred', type: 'error' },
        ];
        (useSystemLogic.useSystemLog as jest.Mock).mockReturnValue(mockLogs);

        render(<SystemLog />);

        const errorText = screen.getByText('Error occurred');
        expect(errorText).toHaveClass('text-red-500');
        expect(screen.getByText('[error]')).toBeInTheDocument();
    });

    it('should render success log with correct styling', () => {
        const mockLogs: LogEntry[] = [
            { id: '1', timestamp: '10:00:00', message: 'Success', type: 'success' },
        ];
        (useSystemLogic.useSystemLog as jest.Mock).mockReturnValue(mockLogs);

        render(<SystemLog />);

        const successText = screen.getByText('Success');
        expect(successText).toHaveClass('text-emerald-400');
        expect(screen.getByText('[success]')).toBeInTheDocument();
    });

    it('should render warning log with correct styling', () => {
        const mockLogs: LogEntry[] = [
            { id: '1', timestamp: '10:00:00', message: 'Warning', type: 'warning' },
        ];
        (useSystemLogic.useSystemLog as jest.Mock).mockReturnValue(mockLogs);

        render(<SystemLog />);

        const warningText = screen.getByText('Warning');
        expect(warningText).toHaveClass('text-yellow');
        expect(screen.getByText('[warning]')).toBeInTheDocument();
    });

    it('should render system log with correct styling', () => {
        const mockLogs: LogEntry[] = [
            { id: '1', timestamp: '10:00:00', message: 'System event', type: 'system' },
        ];
        (useSystemLogic.useSystemLog as jest.Mock).mockReturnValue(mockLogs);

        render(<SystemLog />);

        const systemText = screen.getByText('System event');
        expect(systemText).toHaveClass('text-white');
        expect(screen.getByText('[system]')).toBeInTheDocument();
    });

    it('should render info log with correct styling', () => {
        const mockLogs: LogEntry[] = [
            { id: '1', timestamp: '10:00:00', message: 'Info message', type: 'info' },
        ];
        (useSystemLogic.useSystemLog as jest.Mock).mockReturnValue(mockLogs);

        render(<SystemLog />);

        const infoText = screen.getByText('Info message');
        expect(infoText).toHaveClass('text-blue-400');
        expect(screen.getByText('[info]')).toBeInTheDocument();
    });

    it('should call clearSysLog when clear button is clicked', () => {
        render(<SystemLog />);

        fireEvent.click(screen.getByText('[ Clear_Buffer ]'));

        expect(useSystemLogic.clearSysLog).toHaveBeenCalled();
    });

    it('should render with crt-container class', () => {
        const { container } = render(<SystemLog />);

        expect(container.querySelector('.crt-container')).toBeInTheDocument();
    });

    it('should render active session indicator', () => {
        render(<SystemLog />);

        expect(screen.getByText(/Active_Session/i)).toBeInTheDocument();
    });

    it('should not call scrollToBottom on first render when empty', () => {
        (useSystemLogic.useSystemLog as jest.Mock).mockReturnValue([]);

        render(<SystemLog />);

        expect(mockScrollIntoView).not.toHaveBeenCalled();
    });

    it('should call scrollToBottom when log updates happen after initial load (covers lines 12-16 & 23-24)', () => {
        (useSystemLogic.useSystemLog as jest.Mock).mockReturnValue([]);
        const { rerender } = render(<SystemLog />);
        expect(mockScrollIntoView).not.toHaveBeenCalled();

        const updatedLogs: LogEntry[] = [
            {
                id: '1',
                timestamp: '12:34:56',
                message: 'Realtime telemetry trace data stream updated',
                type: 'system',
            },
        ];
        (useSystemLogic.useSystemLog as jest.Mock).mockReturnValue(updatedLogs);

        rerender(<SystemLog />);

        expect(mockScrollIntoView).toHaveBeenCalledWith({
            behavior: 'smooth',
            block: 'nearest',
        });
    });

    it('should not call scrollToBottom on log collection change if array is left empty', () => {
        (useSystemLogic.useSystemLog as jest.Mock).mockReturnValue([]);
        const { rerender } = render(<SystemLog />);

        rerender(<SystemLog />);

        expect(mockScrollIntoView).not.toHaveBeenCalled();
    });
});
