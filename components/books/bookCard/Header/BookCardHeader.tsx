import { useUserState } from '@/providers/user/utils/useUser';
import { Chip } from '@mui/material';
import { BookRating } from './BookRating';
import { WishlistActionForm } from './WishlistActionForm';

export const BookCardHeader = ({ book }: { book: Book }) => {
    const { loggedIn, profileExists } = useUserState();
    const { stock_quantity, reviews = [] } = book;

    const isOutOfStock = stock_quantity === 0;
    const isLowStock = stock_quantity > 0 && stock_quantity <= 25;
    const showWishlist = loggedIn && profileExists;

    return (
        <div className="grid w-full grid-cols-3 items-center">
            <div className="flex justify-start">
                {showWishlist ? <WishlistActionForm book={book} /> : <div className="h-8 w-8" />}
            </div>

            <div className="flex justify-center">
                {isOutOfStock ? (
                    <Chip
                        label="Sold Out"
                        variant="outlined"
                        color="default"
                        size="small"
                        sx={{
                            fontSize: '0.65rem',
                            height: '20px',
                            textTransform: 'uppercase',
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            border: '1px solid #cbd5e1',
                        }}
                    />
                ) : isLowStock ? (
                    <Chip
                        label={`${stock_quantity} left`}
                        color="error"
                        size="small"
                        sx={{
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            height: '20px',
                            '& .MuiChip-label': { px: 1 },
                        }}
                    />
                ) : (
                    <div className="h-5" />
                )}
            </div>

            <div className="flex justify-end">
                <BookRating reviews={reviews} />
            </div>
        </div>
    );
};
