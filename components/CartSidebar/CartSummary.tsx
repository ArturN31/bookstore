import { useCartState } from '@/providers/cart/utils/useCart';

export const CartSummary = () => {
    const { cartBooks, cartBooksAmount, cartItemsAmount, cartTotal } = useCartState();

    return (
        cartBooks && (
            <div className="flex flex-col gap-2 border-t border-gray-200 px-4 py-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Books:</span>
                    <span className="text-sm font-semibold text-gray-800">{cartBooksAmount}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Items:</span>
                    <span className="text-sm font-semibold text-gray-800">{cartItemsAmount}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
                    <span className="text-base font-semibold text-gray-800">Total:</span>
                    <span className="text-lg font-bold text-indigo-600">
                        £{(Number(cartTotal) || 0).toFixed(2)}
                    </span>
                </div>
            </div>
        )
    );
};
