import Link from 'next/link';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface UserReviewHeaderProps {
    bookId: string;
    bookData: BookDB | Partial<BookDB> | null | undefined;
}

export const UserReviewHeader = ({ bookId, bookData }: UserReviewHeaderProps) => {
    if (!bookData?.title) {
        return null;
    }

    return (
        <div className="flex items-center justify-between px-1">
            <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#E8E2D5] text-[#1C1917]">
                    <MenuBookOutlinedIcon style={{ fontSize: 18 }} />
                </span>
                <div className="flex flex-wrap items-baseline gap-x-2 truncate">
                    <Link
                        href={`/book/${bookId}`}
                        className="truncate text-base font-bold text-[#1C1917] transition-colors hover:text-blue-600"
                    >
                        {bookData.title}
                    </Link>
                    {bookData.author && (
                        <span className="truncate text-xs text-[#78716C]">
                            by <span className="font-medium text-[#44403C]">{bookData.author}</span>
                        </span>
                    )}
                </div>
            </div>

            <Link
                href={`/book/${bookId}`}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-stone-500 transition-colors hover:text-blue-600"
            >
                View Book
                <ArrowForwardIcon style={{ fontSize: 14 }} />
            </Link>
        </div>
    );
};
