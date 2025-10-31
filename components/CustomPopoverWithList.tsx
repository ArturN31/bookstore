'use client';

import { Button, Popover, SvgIconTypeMap } from '@mui/material';
import { ReactElement, useState } from 'react';

type ButtonContent = {
	btnText: string;
	btnIcon: ReactElement<any, any> | undefined;
	listToRender: string[] | undefined;
	listIcons: ReactElement<any, any>[] | undefined;
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
	const baseId = btnText ? btnText.toLocaleLowerCase().replaceAll(' ', '-') : 'icon';
	const id = `popover-${baseId}`;
	const ariaLabel = btnText ? `${btnText} menu` : `Open menu`;

	const defaultBtnStyle = {
		color: '#364153',
		fontWeight: '600',
		textTransform: 'capitalize',
		':hover': {
			backgroundColor: 'inherit',
			textDecorationLine: 'underline',
			color: '#155dfc',
		},
		':active': {
			backgroundColor: 'inherit',
		},
	};

	const iconBtnStyle = {
		borderRadius: 'calc(infinity * 1px)',
		width: '48px',
		height: '48px',
		display: 'grid',
		placeItems: 'center',
		backgroundColor: '#f7cb15',
		color: 'black',
		boxShadow: '0 4px 6px -1px black',
		padding: '0',
		minWidth: '0',
		minHeight: '0',
		cursor: 'pointer',
		':hover': {
			backgroundColor: '#f7cb1580',
			border: '1px solid black',
		},
	};

	return (
		<>
			<Button
				data-testid={`${id}-btn`}
				aria-controls={open ? id : undefined}
				aria-haspopup='menu'
				aria-expanded={open ? 'true' : 'false'}
				aria-label={ariaLabel}
				variant='text'
				onClick={handleClick}
				sx={btnText ? defaultBtnStyle : iconBtnStyle}>
				{btnText ? btnText : btnIcon}
			</Button>
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
				}}>
				{listToRender &&
					[...listToRender].map((listItem, index) => {
						return (
							<Button
								data-testid={`${id}-choice-${listItem
									.toLocaleLowerCase()
									.replaceAll(' ', '-')}`}
								key={listItem}
								role='menuitem'
								onClick={() => {
									listItemOnClick(listItem);
									handleClose();
								}}
								endIcon={listIcons ? listIcons[index] : undefined}
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									color: '#364153',
									width: '100%',
									paddingX: '12px',
									paddingY: '12px',
									textTransform: 'capitalize',
									borderRadius: '6px',
									borderLeft: '4px solid transparent',
									':hover': {
										backgroundColor: '#383e44',
										color: '#ffffff',
										borderLeft: '4px solid #f7cb15',
									},
									':focus': {
										backgroundColor: '#383e44',
										color: '#ffffff',
										outline: '2px solid #f7cb15',
									},
								}}>
								{listItem}
							</Button>
						);
					})}

				{message && <p role='alert'>{message}</p>}
			</Popover>
		</>
	);
};
