import { CartItemContent } from '@/components/CartSidebar/CartItem/CartItemContent';
import { CartItemRemove } from '@/components/CartSidebar/CartItem/CartItemRemove';

export const CartItem = ({ book }: { book: Book }) => {
    return (
        <div className="flex items-center bg-white px-4 py-3 transition-transform duration-200 hover:bg-gray-50">
            <CartItemRemove book={book} />
            <CartItemContent book={book} />
        </div>
    );
};
