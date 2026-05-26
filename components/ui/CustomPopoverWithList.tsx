'use client';

import { Popover } from '@mui/material';
import React, { ReactNode, useState } from 'react';

type ButtonContent = {
    btnText: string;
    btnIcon: ReactNode | undefined;
    listToRender: string[] | undefined;
    listIcons: ReactNode[] | undefined;
    message: string | undefined;
    listItemOnClick: (listItem: string) => void;
};

export const CustomPopoverWithList = ({
    btnText,
    btnIcon,
    listToRender,
    listIcons,
    message,
    listItemOnClick,
}: ButtonContent) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
        if (anchorEl) anchorEl.focus();
    };

    const open = Boolean(anchorEl);
    const isTextMode = btnText && btnText.trim() !== '';
    const baseId = isTextMode ? btnText.toLocaleLowerCase().replaceAll(' ', '-') : 'icon';
    const id = `popover-${baseId}`;
    const ariaLabel = isTextMode ? `${btnText} menu` : `Open menu`;

    return (
        <>
            <button
                type="button"
                data-testid={`${id}-btn`}
                aria-controls={open ? id : undefined}
                aria-haspopup="menu"
                aria-expanded={open ? 'true' : 'false'}
                aria-label={ariaLabel}
                onClick={handleClick}
                className={
                    btnText
                        ? 'px-2 py-1.5 font-semibold text-[#364153] capitalize transition-colors duration-200 hover:bg-transparent hover:text-[#155dfc] hover:underline active:bg-transparent'
                        : 'bg-yellow grid h-12 min-h-0 w-12 min-w-0 cursor-pointer place-items-center rounded-full p-0 text-black shadow-[0_4px_6px_-1px_rgba(0,0,0,1)] transition-all duration-200 hover:border hover:border-black hover:bg-[#f7cb1580]'
                }
            >
                {btnText ? btnText : btnIcon}
            </button>

            <Popover
                data-testid={`${id}-list`}
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                slotProps={{
                    paper: {
                        role: 'menu',
                        sx: {
                            minWidth: '150px',
                            maxHeight: '250px',
                            marginTop: '4px',
                            overflowY: 'auto',
                            borderRadius: '8px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                            padding: '4px',
                        },
                    },
                }}
            >
                {listToRender?.map((listItem, index) => {
                    const cleanChoiceId = listItem.toLocaleLowerCase().replaceAll(' ', '-');
                    return (
                        <button
                            type="button"
                            data-testid={`${id}-choice-${cleanChoiceId}`}
                            key={listItem}
                            role="menuitem"
                            onClick={() => {
                                listItemOnClick(listItem);
                                handleClose();
                            }}
                            className="hover:border-yellow focus:ring-yellow flex w-full cursor-pointer items-center justify-between rounded-md border-l-4 border-transparent px-3 py-3 text-sm font-medium text-[#364153] capitalize transition-all duration-150 hover:border-l-4 hover:bg-[#383e44] hover:text-white focus:bg-[#383e44] focus:text-white focus:ring-2 focus:outline-none"
                        >
                            <span>{listItem}</span>
                            {listIcons && listIcons[index] && (
                                <span className="ml-2 flex items-center">{listIcons[index]}</span>
                            )}
                        </button>
                    );
                })}

                {message && (
                    <p
                        role="alert"
                        className="p-2 text-sm text-gray-500"
                    >
                        {message}
                    </p>
                )}
            </Popover>
        </>
    );
};
