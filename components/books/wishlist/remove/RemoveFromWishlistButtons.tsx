'use client';

import HeartBrokenIcon from '@mui/icons-material/HeartBroken';
import FavoriteIcon from '@mui/icons-material/Favorite';

import { useState } from 'react';

export const RemoveFromWishlistButtons = () => {
	const [hover, setHover] = useState(false);
	return (
		<div
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}>
			{hover ? (
				<button type='submit'>
					<HeartBrokenIcon sx={{ color: '#000' }} />
				</button>
			) : (
				<button type='submit'>
					<FavoriteIcon sx={{ color: '#ff0000' }} />
				</button>
			)}
		</div>
	);
};
