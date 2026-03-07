import { BookCardHeader } from '@/components/books/bookCard/Header/BookCardHeader';
import { BookCardBody } from '@/components/books/bookCard/Body/BookCardBody';

export const BookCard = ({ book }: { book: Book }) => {
    return (
        <div className="w-full max-w-75">
            <BookCardHeader book={book} />
            <BookCardBody book={book} />
        </div>
    );
};
