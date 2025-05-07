import Link from 'next/link';

export const ReviewPagination = ({
	reviewsData,
	slug,
	page,
}: {
	reviewsData: PaginatedReviewsResult;
	slug: string;
	page: number;
}) => {
	if (!reviewsData?.totalPages || reviewsData.totalPages <= 1) {
		return null;
	}

	const pages = [];
	for (let i = 1; i <= reviewsData.totalPages; i++) {
		pages.push(
			<Link
				key={i}
				href={`/book/${slug}?reviewPagination=${i}`}
				className={`px-2 py-1 rounded-md text-sm ${
					page === i ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
				}`}>
				{i}
			</Link>,
		);
	}

	return (
		<div className='flex items-center justify-center mt-4 gap-2'>
			<Link
				href={`/book/${slug}?reviewPagination=${page > 1 ? page - 1 : 1}`}
				className={`px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 ${
					page === 1 ? 'pointer-events-none opacity-50' : ''
				}`}>
				Previous
			</Link>
			{pages}
			<Link
				href={`/book/${slug}?reviewPagination=${page < reviewsData.totalPages ? page + 1 : reviewsData.totalPages}`}
				className={`px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 ${
					page === reviewsData.totalPages ? 'pointer-events-none opacity-50' : ''
				}`}>
				Next
			</Link>
		</div>
	);
};
