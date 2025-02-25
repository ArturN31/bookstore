'use client';

import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { useState } from 'react';

export const AddToWishlistButtons = () => {
	const [hover, setHover] = useState(false);
	return (
		<div
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}>
			{hover ? (
				<button
					type='submit'
					className='hover:cursor-pointer'>
					<BookmarkAddOutlinedIcon sx={{ color: '#007700' }} />
				</button>
			) : (
				<button
					type='submit'
					className='hover:cursor-pointer'>
					<BookmarkBorderIcon />
				</button>
			)}
		</div>
	);
};
