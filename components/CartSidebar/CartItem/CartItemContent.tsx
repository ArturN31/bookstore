import Image from 'next/image';
import { useCartState } from '@/providers/cart/utils/useCart';
import { useMemo } from 'react';
import { ChangeQuantityForm } from '@/components/CartForms/ChangeQuantityForm';

export const CartItemContent = ({ book }: { book: Book }) => {
    const { cartBooks } = useCartState();

    const currentCartItem = cartBooks.find((item) => String(item.id) === String(book.id));
    const quantity = currentCartItem?.quantity ?? 0;

    const { subtotal, originalPrice } = useMemo(() => {
        const parsePrice = (price: any) => {
            if (typeof price !== 'string') return 0;
            return parseFloat(price.replace(/[^0-9.-]+/g, '')) || 0;
        };

        const priceValue = parsePrice(book.price);

        return {
            subtotal: (priceValue * quantity).toFixed(2),
            originalPrice: priceValue.toFixed(2),
        };
    }, [book.price, quantity]);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                        {book.image_url ? (
                            <Image
                                width={64}
                                height={64}
                                src={book.image_url}
                                alt={book.title || 'Book cover'}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                                No Cover
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-gray-800">
                            {book.title || 'Unknown Title'}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                            <p className="text-xs font-bold text-gray-800">{`£${subtotal}`}</p>
                            {quantity > 1 && (
                                <p className="text-xs text-gray-500">{`£${originalPrice}`}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-end">
                    <ChangeQuantityForm bookID={String(book.id)} />
                </div>
            </div>
        </div>
    );
};
