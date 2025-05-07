import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import StarRateIcon from '@mui/icons-material/StarRate';

export const ReviewCard = async ({ review }: { review: Review }) => {
	const createdAt = new Date(review.created_at);
	const updatedAt = new Date(review.updated_at);

	return (
		<div className='bg-white rounded-md border border-gray-200 shadow-sm p-4 flex flex-col gap-3 hover:bg-gray-50 transition duration-150 ease-in-out sm:p-6 sm:gap-4'>
			<div className='flex flex-col sm:flex-row sm:items-center justify-between text-sm'>
				<div className='flex items-center gap-2 text-gray-500 mb-2 sm:mb-0'>
					<PersonOutlineIcon className='w-5 h-5 text-indigo-500' />
					<h4 className='font-semibold text-indigo-600 tracking-tight text-base sm:text-sm'>{review.username}</h4>
				</div>
				<div className='flex items-center justify-between sm:justify-end gap-4 sm:gap-6'>
					{' '}
					{/* Increased gap */}
					<div className='flex items-center gap-2 text-gray-500'>
						<CalendarMonthIcon className='w-4 h-4 text-gray-400' />
						<p>Reviewed {createdAt.toLocaleDateString()}</p>
						{updatedAt.getTime() !== createdAt.getTime() && (
							<p className='text-xs'>(Updated {updatedAt.toLocaleDateString()})</p>
						)}
					</div>
					<p className='bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full px-2 py-1 flex items-center gap-1'>
						{review.rating}/5 <StarRateIcon className='w-4 h-4' /> {/* Smaller star */}
					</p>
				</div>
			</div>

			<div className='leading-relaxed text-gray-800 break-words text-sm sm:text-base mt-2'>{review.review}</div>
		</div>
	);
};
