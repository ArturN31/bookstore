'use client';

import { useState, useEffect } from 'react';

/** A timestamped entry displayed in the DevTools system console. */
export type LogEntry = {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'error' | 'success' | 'warning' | 'system';
};

/**
 * Dispatches a system-log event for browser-side DevTools consumers.
 *
 * @param message Text to display in the system log.
 * @param type Severity or category used to style the entry.
 */
export const sysLog = (message: string, type: LogEntry['type'] = 'info') => {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('sys-log', {
            detail: { message, type },
        });
        window.dispatchEvent(event);
    }
};

/**
 * Dispatches an event that clears all entries from the system log.
 */
export const clearSysLog = () => {
    if (typeof window !== 'undefined') {
        const event = new Event('sys-clear');
        window.dispatchEvent(event);
    }
};

/**
 * Subscribes to browser system-log events and maintains the latest 50 entries.
 *
 * @returns The current timestamped log entries.
 */
export function useSystemLog() {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        const handleNewLog = (e: any) => {
            const newEntry: LogEntry = {
                id: Math.random().toString(36).substring(2, 9),
                timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                ...e.detail,
            };
            setLogs((prev) => [...prev, newEntry].slice(-50));
        };

        const handleClear = () => setLogs([]);

        window.addEventListener('sys-log', handleNewLog);
        window.addEventListener('sys-clear', handleClear);

        return () => {
            window.removeEventListener('sys-log', handleNewLog);
            window.removeEventListener('sys-clear', handleClear);
        };
    }, []);

    return logs;
}
