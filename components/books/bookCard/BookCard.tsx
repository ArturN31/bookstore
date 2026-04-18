'use client';

import { Card } from '@mui/material';
import { useRouter } from 'next/navigation';
import { BookCardHeader } from './BookCardHeader';
import { BookCardBody } from './BookCardBody';
import { BookCardFooter } from './BookCardFooter';

export const BookCard = ({ book }: { book: Book }) => {
    const { push } = useRouter();
    const isOutOfStock = book.stock_quantity === 0;

    return (
        <Card
            className={`group relative flex h-full w-full cursor-pointer flex-col overflow-hidden bg-white transition-all duration-500 hover:shadow-2xl ${isOutOfStock ? 'opacity-90' : 'opacity-100'}`}
            sx={{
                border: '1px solid #f1f5f9',
                borderRadius: '20px',
                boxShadow: '0 10px 30px -15px rgba(0,0,0,0.07)',
                '&:hover': { transform: 'translateY(-6px)' },
            }}
            onClick={() => push(`/book/${book.id}`)}
        >
            <BookCardHeader book={book} />
            <BookCardBody book={book} />
            <BookCardFooter book={book} />
        </Card>
    );
};
