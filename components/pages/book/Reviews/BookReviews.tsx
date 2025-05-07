import { ReviewCard } from './ReviewCard/ReviewCard';
import { ReviewPagination } from './ReviewPagination';

export const BookReviews = ({
	reviewsData,
	slug,
	page,
}: {
	reviewsData: PaginatedReviewsResult;
	slug: string;
	page: number;
}) => {
	if (!reviewsData.data) return;
	return (
		<div>
			<p className='text-lg font-semibold'>({reviewsData.total}) Reviews</p>
			<div className='grid gap-3 pt-3'>
				{reviewsData.data.map((review) => {
					return (
						<ReviewCard
							review={review}
							key={review.id}
						/>
					);
				})}
			</div>

			<ReviewPagination
				reviewsData={reviewsData}
				slug={slug}
				page={page}
			/>
		</div>
	);
};
