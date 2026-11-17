import { Database } from '@/database.types';

type DiscountValue = Pick<Database['public']['Tables']['discounts']['Row'], 'type' | 'value'>;

export const calculateDiscountAmount = (subtotal: number, discount: DiscountValue): number => {
    const value = Number(discount.value);
    if (discount.type === 'percentage') return Math.round(((subtotal * value) / 100) * 100) / 100;
    if (discount.type === 'fixed_amount' || discount.type === 'fixed')
        return Math.min(subtotal, value);
    return 0;
};

export const parseBookPrice = (price: string): number => {
    if (typeof price !== 'string')
        throw new Error('Book price must be a non-negative number.');

    const parsedPrice = Number(price.replace(/[£,]/g, '').trim());
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0)
        throw new Error('Book price must be a non-negative number.');
    return parsedPrice;
};
