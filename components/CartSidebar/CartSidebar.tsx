import { Dispatch, SetStateAction } from 'react';
import { CartSummary } from '@/components/CartSidebar/CartSummary';
import { CartHeader } from '@/components/CartSidebar/CartHeader';
import { CartItem } from '@/components/CartSidebar/CartItem/CartItem';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useRouter } from 'next/navigation';
import { useCartState } from '@/providers/cart/utils/useCart';

export const CartSidebar = ({
    openCart,
    setOpenCart,
}: {
    openCart: boolean;
    setOpenCart: Dispatch<SetStateAction<boolean>>;
}) => {
    const router = useRouter();
    const { cartBooks } = useCartState();

    const handleCloseCart = () => setOpenCart(false);

    const isCartEmpty = !cartBooks || cartBooks.length === 0;

    return (
        <div
            aria-modal="true"
            role="dialog"
            className={`fixed top-0 right-0 z-50 h-full w-auto max-w-[90vw] min-w-75 transform overflow-y-auto border-l border-black bg-white transition-transform duration-1000 ease-in-out ${openCart ? 'translate-x-0' : 'translate-x-full'}`}
        >
            <CartHeader handleCloseCart={handleCloseCart} />

            {isCartEmpty ? (
                <div className="grid gap-3 py-10 text-center">
                    <ShoppingCartIcon sx={{ color: '#6a7282', margin: 'auto' }} />
                    <p className="text-gray-500">Your cart is currently empty.</p>
                </div>
            ) : (
                <>
                    <ul className="space-y-4 overflow-auto p-4">
                        {[...cartBooks].map((book, index) => (
                            <li key={book.id || `cart-item-${index}`}>
                                <CartItem book={book} />
                                {index < cartBooks.length - 1 && (
                                    <hr className="my-4 border-t border-gray-200" />
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className="sticky bottom-0">
                        <div className="w-full bg-gray-50">
                            <CartSummary />
                        </div>
                        <div className="bg-gunmetal w-full p-4">
                            <button
                                className="text-gunmetal w-full rounded-md bg-white py-3 font-semibold transition-colors duration-200 hover:cursor-pointer hover:bg-gray-100"
                                onClick={() => router.push('/checkout')}
                            >
                                Proceed to Checkout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
