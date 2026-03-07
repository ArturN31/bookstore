'use client';

import { useUserState } from '@/providers/user/utils/useUser';
import { useCartState } from '@/providers/cart/utils/useCart';
import { ChangeQuantityForm } from '@/components/CartForms/ChangeQuantityForm';
import { CartActionForm } from '@/components/CartForms/CartActionForm';
import Link from 'next/link';

import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export const BookCart = ({ book }: { book: Book }) => {
    const { loggedIn, profileExists } = useUserState();
    const { cartBooks } = useCartState();

    const cartEntry = cartBooks.find((item) => item.id === book.id);
    const showAuthPrompt = !loggedIn || !profileExists;

    const unitPrice = parseFloat(book.price.replace(/[^0-9.-]+/g, ''));
    const quantity = cartEntry?.quantity || 1;
    const totalPriceValue = unitPrice * quantity;

    const formattedTotalPrice = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
    }).format(totalPriceValue);

    return (
        <div className="bg-gunmetal flex min-h-87.5 flex-col justify-between rounded-md border border-black p-6 text-center text-white shadow-lg sm:col-span-2 md:col-span-1">
            <div className="space-y-1">
                <p className="text-xs tracking-widest text-gray-400 uppercase">
                    {cartEntry ? 'Subtotal' : 'Total Price'}
                </p>
                <p className="text-3xl font-bold tracking-tight text-white transition-all duration-300">
                    {formattedTotalPrice}
                </p>
                {quantity > 1 && (
                    <p className="text-[12px] text-gray-500 italic">{book.price} each</p>
                )}
            </div>

            <div className="my-6 space-y-4">
                {showAuthPrompt ? (
                    <div className="rounded-md bg-white/5 p-4 ring-1 ring-white/10">
                        <div className="mb-1 flex items-center justify-center gap-2 text-sky-400">
                            <InfoOutlinedIcon fontSize="small" />
                            <p className="text-sm font-semibold">Member Benefit</p>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-400">
                            Create an account{' '}
                            <Link
                                href="/user/auth/signup"
                                className="text-sky-400 underline underline-offset-4 transition-colors hover:text-sky-300"
                            >
                                here
                            </Link>{' '}
                            to access our full bookstore features.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {cartEntry && <ChangeQuantityForm bookID={cartEntry.id} />}
                        <CartActionForm
                            bookID={book.id}
                            stock={book.stock_quantity}
                        />
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <hr className="h-px border-0 bg-linear-to-r from-transparent via-neutral-600 to-transparent" />

                <div className="space-y-3 text-xs text-gray-400">
                    <div className="flex items-center justify-center gap-3">
                        <LocalShippingOutlinedIcon
                            sx={{ fontSize: 18 }}
                            className="text-gray-500"
                        />
                        <span>Parcel dispatched in 24h</span>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <StorefrontOutlinedIcon
                            sx={{ fontSize: 18 }}
                            className="text-gray-500"
                        />
                        <span>Free delivery to the bookstore</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
