import StarRateRoundedIcon from '@mui/icons-material/StarRateRounded';

export const OutputBookRating = ({ ratings }: { ratings: number[] }) => {
	const ratingsTotal = ratings.reduce((total, value) => total + value, 0);
	const rating = ratings.length > 0 ? (ratingsTotal / ratings.length).toPrecision(3) : 0;

	return (
		<p className='flex items-center justify-end select-none'>
			<span className='text-xs font-semibold'>{rating}</span>
			<StarRateRoundedIcon sx={{ color: '#f7cb15' }} />
		</p>
	);
};
