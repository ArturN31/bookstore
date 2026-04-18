'use client';

import { Tooltip, TooltipProps, Zoom } from '@mui/material';
import { ReactElement } from 'react';

interface AppTooltipProps extends Omit<TooltipProps, 'children' | 'title'> {
    title: string;
    children: ReactElement;
    variant?: 'default' | 'accent';
}

export const AppTooltip = ({ title, children, variant = 'default', ...props }: AppTooltipProps) => {
    return (
        <Tooltip
            {...props}
            title={title}
            slots={{ transition: Zoom }}
            slotProps={{
                tooltip: {
                    className: `
                        px-4 py-1.5 rounded-none shadow-none
                        [clip-path:polygon(10%_0,100%_0,100%_70%,90%_100%,0_100%,0_30%)]
                        text-[10px] font-[900] uppercase italic
                        
                        /* Colors: High-contrast yellow/navy combo */
                        ${
                            variant === 'accent'
                                ? 'bg-[#facc15] text-black'
                                : 'bg-[#1e293b] text-[#facc15]'
                        }
                    `,
                },
                popper: {
                    modifiers: [{ name: 'offset', options: { offset: [10, 5] } }],
                },
            }}
        >
            <div className="inline-flex cursor-default">{children}</div>
        </Tooltip>
    );
};
