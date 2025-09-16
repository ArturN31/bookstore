import StarRateRoundedIcon from '@mui/icons-material/StarRateRounded';

export const BookRating = ({ reviews }: { reviews: Review[] }) => {
	const bookRatings = reviews.map((review) => {
		return review.rating;
	});
	const ratingsTotal = bookRatings.reduce((total, value) => total + value, 0);
	const rating =
		bookRatings.length > 0 ? (ratingsTotal / bookRatings.length).toPrecision(3) : 0;

	return (
		<p className='flex items-center justify-end select-none'>
			<span className='text-xs font-semibold'>{rating}</span>
			<StarRateRoundedIcon sx={{ color: '#f7cb15' }} />
		</p>
	);
};
