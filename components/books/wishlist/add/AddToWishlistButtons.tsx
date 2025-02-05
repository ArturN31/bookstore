'use client';

import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useState } from 'react';

export const AddToWishlistButtons = () => {
	const [hover, setHover] = useState(false);
	return (
		<div
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}>
			{hover ? (
				<button type='submit'>
					<FavoriteBorderIcon sx={{ color: '#ff0000', stroke: '#ff0000', strokeWidth: 1 }} />
				</button>
			) : (
				<button type='submit'>
					<FavoriteBorderIcon />
				</button>
			)}
		</div>
	);
};
