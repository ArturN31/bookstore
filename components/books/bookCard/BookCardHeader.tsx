'use client';

import { useUserState } from '@/providers/user/utils/useUser';
import { WishlistActionForm } from './Header/WishlistActionForm';
import { BookRating } from './Header/BookRating';

export const BookCardHeader = ({ book }: { book: Book }) => {
    const { loggedIn, profileExists } = useUserState();
    const showWishlist = loggedIn && profileExists;

    return (
        <div className="1080p:p-3 4k:p-8 absolute inset-x-0 top-0 z-20 flex items-start justify-between p-2">
            <div className="4k:scale-150 origin-top-left scale-90 drop-shadow-md lg:scale-100">
                {showWishlist && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <WishlistActionForm book={book} />
                    </div>
                )}
            </div>

            <div className="4k:scale-150 origin-top-right scale-75 lg:scale-100">
                <BookRating
                    reviews={book.reviews || []}
                    variant="badge"
                />
            </div>
        </div>
    );
};
