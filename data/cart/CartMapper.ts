import { Database } from '@/database.types';

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

    const books: CartItem[] = casted.shopping_cart_items
        .filter(
            (item): item is DBItem & { books: NonNullable<DBItem['books']> } => item.books !== null,
        )
        .map((item) => ({
            ...item.books,
            quantity: item.quantity,
        })) as unknown as CartItem[];

    return {
        cartID: casted.id,
        books,
    };
};
