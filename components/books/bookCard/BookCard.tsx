import { BookCardHeader } from './Header/BookCardHeader';
import { BookCardBody } from './Body/BookCardBody';

export const BookCard = ({ book }: { book: Book }) => {
    return (
        <div className="w-full max-w-75">
            <BookCardHeader book={book} />
            <BookCardBody book={book} />
        </div>
    );
};
