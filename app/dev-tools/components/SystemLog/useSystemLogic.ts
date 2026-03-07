'use client';

import { useState, useEffect } from 'react';

export type LogEntry = {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'error' | 'success' | 'warning' | 'system';
};

export const sysLog = (message: string, type: LogEntry['type'] = 'info') => {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('sys-log', {
            detail: { message, type },
        });
        window.dispatchEvent(event);
    }
};

export const clearSysLog = () => {
    if (typeof window !== 'undefined') {
        const event = new Event('sys-clear');
        window.dispatchEvent(event);
    }
};

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
