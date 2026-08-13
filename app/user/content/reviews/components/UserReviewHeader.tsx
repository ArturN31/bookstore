import Link from 'next/link';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { BookInfo } from './page';

interface UserReviewHeaderProps {
    bookId: string;
    bookData: BookInfo | BookInfo[] | null | undefined;
}

export const UserReviewHeader = ({ bookId, bookData }: UserReviewHeaderProps) => {
    const book = Array.isArray(bookData) ? bookData[0] : bookData;

    if (!book?.title) return null;

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
                        {book.title}
                    </Link>
                    {book.author && (
                        <span className="truncate text-xs text-[#78716C]">
                            by <span className="font-medium text-[#44403C]">{book.author}</span>
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
