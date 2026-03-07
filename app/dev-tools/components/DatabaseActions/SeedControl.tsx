'use client';

import { useActionState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { sysLog } from '../SystemLog/useSystemLogic';
import { systemCommandAction, fullResetAction } from '../../actions/actions';

interface SeedControlProps {
    type:
        | 'reset'
        | 'add_sales'
        | 'seed_discounts'
        | 'stock_purge'
        | 'review_bomb'
        | 'add_carts'
        | 'add_wishlists'
        | 'add_books';
}

export function SeedControl({ type }: SeedControlProps) {
    const actionToRun = type === 'reset' ? fullResetAction : systemCommandAction;
    const [state, formAction, isPending] = useActionState(actionToRun, null);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        const telemetryUnit = document.getElementById('telemetry-unit');

        if (isPending) {
            sysLog(`Initiating ${type.toUpperCase()} sequence...`, 'info');
            if (type === 'reset' && telemetryUnit) {
                telemetryUnit.classList.add('animate-system-shake');
                sysLog('ALERT: Magnetic interference detected during wipe.', 'warning');
            }
        } else {
            telemetryUnit?.classList.remove('animate-system-shake');
        }
    }, [isPending, type]);

    useEffect(() => {
        if (state) {
            const variant = state.success ? 'success' : 'error';
            enqueueSnackbar(state.message, {
                variant,
                style: { fontFamily: 'monospace', fontSize: '12px' },
            });
            sysLog(state.message, variant);
        }
    }, [state, enqueueSnackbar]);

    const handleAction = (formData: FormData) => {
        const warnings: Record<string, string> = {
            reset: 'CRITICAL: Atomic Reset?',
            add_sales: 'Inject 50 Sales?',
            seed_discounts: 'Generate 5 Discounts?',
            stock_purge: 'Kill 50% of Stock?',
            review_bomb: 'Inject 50 Reviews?',
            add_carts: 'Inject 15 Carts?',
            add_wishlists: 'Inject 50 Wishlists?',
            add_books: 'Inject 50 Books?',
        };

        if (window.confirm(warnings[type] || 'Execute command?')) {
            sysLog(`User authorized ${type.toUpperCase()}.`, 'system');
            if (type !== 'reset') formData.append('command', type);
            formAction(formData);
        } else {
            sysLog('Action aborted.', 'warning');
        }
    };

    const styles =
        type === 'reset' || type === 'stock_purge'
            ? 'bg-yellow text-gunmetal border-yellow hover:bg-gunmetal hover:text-yellow shadow-[4px_4px_0px_0px_rgba(247,203,21,0.2)]'
            : 'bg-gunmetal text-white border-gunmetal hover:bg-white hover:text-gunmetal shadow-[4px_4px_0px_0px_rgba(32,39,47,0.1)]';

    return (
        <form action={handleAction}>
            <button
                type="submit"
                disabled={isPending}
                className={`${styles} w-full cursor-pointer border-2 py-3 text-[11px] font-black tracking-[0.2em] uppercase transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-30`}
            >
                {isPending ? 'Executing...' : `Initiate ${type.replace('_', ' ')}`}
            </button>
        </form>
    );
}
