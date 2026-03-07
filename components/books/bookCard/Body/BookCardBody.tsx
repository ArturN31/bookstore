'use client';

import { BookCardBodyContent } from '@/components/books/bookCard/Body/BookCardBodyContent';
import { Card } from '@mui/material';
import { useRouter } from 'next/navigation';

export const BookCardBody = ({ book }: { book: Book }) => {
    const { push } = useRouter();

    return (
        <Card
            data-testid={`book-card-body-${book.title}`}
            className="border-gunmetal relative grid h-full border-2 transition-all duration-300 hover:cursor-pointer"
            sx={{
                ':hover': {
                    borderColor: '#f7cb15',
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '0',
                    height: '4px',
                    backgroundColor: '#f7cb15',
                    transition: 'width 0.3s ease-out, left 0.3s ease-out',
                },
                ':hover::after': {
                    width: '100%',
                    left: 0,
                },
            }}
            onClick={() => {
                push(`/book/${book.id}`);
            }}
        >
            <BookCardBodyContent book={book} />
        </Card>
    );
};
