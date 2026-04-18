import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import Person2OutlinedIcon from '@mui/icons-material/Person2Outlined';
import StarRateIcon from '@mui/icons-material/StarRate';

export type SelectedReview = ReviewDB & {
    created_at: string;
    updated_at: string;
};

export const ReviewCard = async ({ review }: { review: SelectedReview }) => {
    const createdAt = new Date(review.created_at);
    const updatedAt = new Date(review.updated_at);
    const isUpdated = updatedAt.getTime() !== createdAt.getTime();
    const ratingValue = Math.round(review.rating);

    return (
        <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4 shadow-sm transition duration-150 ease-in-out hover:bg-gray-50 sm:gap-4 sm:p-6">
            <div className="flex flex-col justify-between gap-2 text-sm sm:flex-row sm:items-start">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                        <Person2OutlinedIcon sx={{ fontSize: 20 }} />
                    </div>
                    <div>
                        <h4 className="leading-tight font-semibold text-indigo-600">
                            {review.username}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                            <CalendarMonthIcon sx={{ fontSize: 12 }} />
                            <span>{createdAt.toLocaleDateString()}</span>
                            {isUpdated && <span className="italic">(Edited)</span>}
                        </div>
                    </div>
                </div>

                <div
                    className="flex items-center gap-0.5"
                    aria-label={`Rating: ${review.rating} out of 5`}
                >
                    {[1, 2, 3, 4, 5].map((star) => (
                        <StarRateIcon
                            key={star}
                            sx={{ fontSize: 18 }}
                            className={star <= ratingValue ? 'text-yellow-500' : 'text-gray-200'}
                        />
                    ))}
                    <span className="ml-1 text-xs font-bold text-gray-500">{review.rating}</span>
                </div>
            </div>

            <div className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-gray-800 sm:text-base">
                {review.review}
            </div>
        </div>
    );
};
