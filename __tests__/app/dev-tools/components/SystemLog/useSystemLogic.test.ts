import { renderHook, act } from '@testing-library/react';
import { sysLog, clearSysLog, useSystemLog, LogEntry } from '@/app/dev-tools/components/SystemLog/useSystemLogic';

describe('useSystemLogic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sysLog', () => {
        it('should dispatch sys-log event with message and type', () => {
            const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent').mockImplementation(() => true);

            sysLog('Test message', 'success');

            expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
            const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
            expect(event.type).toBe('sys-log');
            expect(event.detail).toEqual({ message: 'Test message', type: 'success' });

            dispatchEventSpy.mockRestore();
        });

        it('should use info as default type', () => {
            const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent').mockImplementation(() => true);

            sysLog('Test message');

            const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
            expect(event.detail.type).toBe('info');

            dispatchEventSpy.mockRestore();
        });

        it('should not dispatch event when window is undefined', () => {
            const originalWindow = global.window;
            delete (global as any).window;

            expect(() => sysLog('Test message')).not.toThrow();

            global.window = originalWindow;
        });
    });

    describe('clearSysLog', () => {
        it('should dispatch sys-clear event', () => {
            const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent').mockImplementation(() => true);

            clearSysLog();

            expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(Event));
            const event = dispatchEventSpy.mock.calls[0][0] as Event;
            expect(event.type).toBe('sys-clear');

            dispatchEventSpy.mockRestore();
        });

        it('should not dispatch event when window is undefined', () => {
            const originalWindow = global.window;
            delete (global as any).window;

            expect(() => clearSysLog()).not.toThrow();

            global.window = originalWindow;
        });
    });

    describe('useSystemLog', () => {
        it('should return empty array initially', () => {
            const { result } = renderHook(() => useSystemLog());

            expect(result.current).toEqual([]);
        });

        it('should add log entries when sys-log event is dispatched', () => {
            const { result } = renderHook(() => useSystemLog());

            act(() => {
                const event = new CustomEvent('sys-log', {
                    detail: { message: 'Test message', type: 'warning' },
                });
                window.dispatchEvent(event);
            });

            expect(result.current).toHaveLength(1);
            expect(result.current[0]).toMatchObject({
                message: 'Test message',
                type: 'warning',
            });
        });

        it('should clear logs when sys-clear event is dispatched', () => {
            const { result } = renderHook(() => useSystemLog());

            act(() => {
                window.dispatchEvent(new CustomEvent('sys-log', {
                    detail: { message: 'Test', type: 'info' },
                }));
            });

            expect(result.current).toHaveLength(1);

            act(() => {
                window.dispatchEvent(new Event('sys-clear'));
            });

            expect(result.current).toHaveLength(0);
        });

        it('should limit logs to 50 entries', () => {
            const { result } = renderHook(() => useSystemLog());

            act(() => {
                for (let i = 0; i < 60; i++) {
                    window.dispatchEvent(new CustomEvent('sys-log', {
                        detail: { message: `Message ${i}`, type: 'info' },
                    }));
                }
            });

            expect(result.current).toHaveLength(50);
            expect(result.current[0].message).toBe('Message 10');
        });

        it('should clean up event listeners on unmount', () => {
            const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

            const { unmount } = renderHook(() => useSystemLog());

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('sys-log', expect.any(Function));
            expect(removeEventListenerSpy).toHaveBeenCalledWith('sys-clear', expect.any(Function));

            removeEventListenerSpy.mockRestore();
        });
    });
});
