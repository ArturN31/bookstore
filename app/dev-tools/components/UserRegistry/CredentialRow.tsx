'use client';

import { useState } from 'react';
import { impulseLogin } from '../../actions/actions';

export const CredentialRow = ({ value, label, isPrimary }: any) => {
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async () => {
        setIsLoggingIn(true);
        try {
            const result = await impulseLogin(value);
            if (result.success) window.location.href = '/';
        } catch (err) {
            alert('Auth sequence interrupted.');
            setIsLoggingIn(false);
        }
    };

    //admin section
    if (isPrimary) {
        return (
            <div className="bg-white p-6">
                <p className="text-yellow mb-2 text-[10px] font-black tracking-[0.2em] uppercase">
                    {label}
                </p>
                <button
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="border-gunmetal bg-gunmetal hover:bg-yellow hover:text-gunmetal flex w-full cursor-pointer items-center justify-between border-2 p-4 text-white transition-all disabled:opacity-50"
                >
                    <span className="truncate font-mono text-sm font-bold">
                        {isLoggingIn ? 'SYNCING...' : value}
                    </span>
                    <span className="text-[10px] font-black uppercase">Login_Impulse</span>
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="hover:text-gunmetal flex cursor-pointer items-center gap-3 text-left font-mono text-xs font-bold text-slate-500 transition-colors disabled:opacity-50"
        >
            <span className="flex items-center gap-3">
                <div className="bg-yellow h-2 w-2" />
                {isLoggingIn ? '...' : value}
            </span>
        </button>
    );
};
