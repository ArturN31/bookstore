'use client';

import BookmarkAddedOutlinedIcon from '@mui/icons-material/BookmarkAddedOutlined';
import BookmarkRemoveOutlinedIcon from '@mui/icons-material/BookmarkRemoveOutlined';
import { useState } from 'react';

export const RemoveFromWishlistButtons = ({ wishlistedBooksAmount }: { wishlistedBooksAmount: number }) => {
	const [hover, setHover] = useState(false);
	return (
		<div
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}>
			{hover ? (
				<button
					type='submit'
					className='hover:cursor-pointer'>
					<BookmarkRemoveOutlinedIcon sx={{ color: '#FF0000' }} />
				</button>
			) : (
				<button
					type='submit'
					className='hover:cursor-pointer'>
					<BookmarkAddedOutlinedIcon />
				</button>
			)}
		</div>
	);
};
