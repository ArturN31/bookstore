import Link from 'next/link';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export const ReviewPagination = ({
    reviewsData,
    slug,
    page,
}: {
    reviewsData: PaginatedReviewsResult;
    slug: string;
    page: number;
}) => {
    const totalPages = reviewsData?.totalPages || 0;
    if (totalPages <= 1) return null;

    const getPageUrl = (p: number) => `/book/${slug}?reviewPagination=${p}#reviews-section`;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        const isCurrent = page === i;
        pages.push(
            <Link
                key={i}
                href={getPageUrl(i)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                    isCurrent
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
                }`}
            >
                {i}
            </Link>,
        );
    }

    return (
        <nav
            className="mt-6 flex items-center justify-center gap-2"
            aria-label="Reviews pagination"
        >
            <Link
                href={getPageUrl(page > 1 ? page - 1 : 1)}
                className={`flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 ${
                    page === 1 ? 'pointer-events-none opacity-40' : ''
                }`}
            >
                <NavigateBeforeIcon sx={{ fontSize: 18 }} />
                <span>Prev</span>
            </Link>

            <div className="flex gap-1">{pages}</div>

            <Link
                href={getPageUrl(page < totalPages ? page + 1 : totalPages)}
                className={`flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 ${
                    page === totalPages ? 'pointer-events-none opacity-40' : ''
                }`}
            >
                <span>Next</span>
                <NavigateNextIcon sx={{ fontSize: 18 }} />
            </Link>
        </nav>
    );
};
