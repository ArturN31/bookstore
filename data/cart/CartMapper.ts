import { Database } from '@/database.types';

export type CartItem = Database['public']['Tables']['books']['Row'] & {
    quantity: number;
};

type DBItem = {
    quantity: number;
    created_at: string;
    books: Database['public']['Tables']['books']['Row'] | null;
};

type DBCartResult = {
    id: string;
    shopping_cart_items: DBItem[];
} | null;

export const mapDatabaseCartToDomain = (data: unknown) => {
    const casted = data as DBCartResult;

    if (!casted || !casted.shopping_cart_items)
        return {
            cartID: casted?.id || null,
            books: [] as CartItem[],
        };

    const books: CartItem[] = casted.shopping_cart_items.flatMap((item) =>
        item.books ? [{ ...item.books, quantity: item.quantity }] : [],
    );

    return {
        cartID: casted.id,
        books,
    };
};
