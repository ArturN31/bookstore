'use client';

import { useEffect, useRef } from 'react';
import { clearSysLog, useSystemLog } from './useSystemLogic';

export function SystemLog() {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);
    const logs = useSystemLog();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
        });
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (logs.length > 0) scrollToBottom();
    }, [logs]);

    return (
        <div className="crt-container border-gunmetal flex h-75 flex-col overflow-hidden border-4 bg-black font-mono shadow-[12px_12px_0px_0px_rgba(32,39,47,0.1)]">
            <div className="bg-gunmetal sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black tracking-[0.2em] text-white/90 uppercase">
                        Console_v4.0.1 // Active_Session
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => clearSysLog()}
                        className="cursor-pointer text-[9px] font-black tracking-widest text-slate-400 uppercase transition-colors hover:text-white"
                    >
                        [ Clear_Buffer ]
                    </button>
                    <span className="text-[10px] font-black text-slate-500 uppercase">
                        LN: {logs.length.toString().padStart(2, '0')}
                    </span>
                </div>
            </div>

            <div className="scrollbar-hide flex-1 space-y-2 overflow-y-auto bg-black/95 p-4">
                {logs.length === 0 && (
                    <div className="animate-pulse text-[10px] text-emerald-500/75 italic">
                        {`> KERNEL: SYSTEM_IDLE...`}
                    </div>
                )}

                {logs.map((log, index) => (
                    <div
                        key={log.id}
                        className={`animate-in fade-in slide-in-from-bottom-1 grid grid-cols-[85px_1fr] gap-3 text-[10px] leading-tight duration-200 ${
                            index === logs.length - 1 ? 'log-entry-new' : ''
                        }`}
                    >
                        <span className="shrink-0 font-bold text-slate-600">[{log.timestamp}]</span>
                        <span
                            className={`font-black tracking-tight break-all uppercase ${
                                log.type === 'error'
                                    ? 'text-red-500'
                                    : log.type === 'success'
                                      ? 'text-emerald-400'
                                      : log.type === 'warning'
                                        ? 'text-yellow'
                                        : log.type === 'system'
                                          ? 'text-white'
                                          : 'text-blue-400'
                            }`}
                        >
                            <span className="mr-1 opacity-50">[{log.type}]</span>
                            {log.message}
                        </span>
                    </div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            <div className="scanline-overlay pointer-events-none opacity-20" />
        </div>
    );
}
