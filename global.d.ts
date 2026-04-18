import type { Tables } from '@/database.types';

declare global {
    // BASE SCHEMAS
    // Inferred directly from Supabase generated types

    type BookDB = Tables<'books'>;
    type ReviewDB = Tables<'book_reviews'>;
    type UserDB = Tables<'users'>;
    type OrderDB = Tables<'orders'>;
    type OrderItemDB = Tables<'order_items'>;
    type OrderDiscountDB = Tables<'order_discounts'>;
    type DiscountDB = Tables<'discounts'>;
    type CartItemDB = Tables<'shopping_cart_items'>;
    type WishlistDB = Tables<'wishlist'>;

    type PaymentMethod =
        | 'Credit Card'
        | 'Debit Card'
        | 'PayPal'
        | 'Apple Pay'
        | 'Google Pay'
        | 'Stripe';

    //APP ENTITIES
    //Extends base schemas with UI-specific or joined fields

    interface Book extends BookDB {
        reviews?: Review[];
        rating?: number;
        avg_rating?: number;
        review_count?: number;
    }

    interface Review extends ReviewDB {}

    interface User extends UserDB {
        email: string;
    }

    interface Order extends OrderDB {}

    interface OrderItem extends OrderItemDB {}

    interface OrderDiscount extends OrderDiscountDB {
        discount_amount: number;
    }

    // FEATURE SPECIFIC TYPES

    interface Wishlist extends WishlistDB {}

    interface CartItem extends Book {
        quantity: number;
    }

    interface Cart {
        cartBooks: CartItem[];
        cartBooksAmount: number; // sum of quantities
        cartItemsAmount: number; // distinct items count
        cartTotal: number;
        cartID: string | null;
        loading: boolean;
    }

    interface PaginatedReviewsResult {
        data: Review[];
        total: number;
        totalPages: number;
        currentPage: number;
    }

    interface GeneratedSalesData {
        orders: Order[];
        items: OrderItem[];
    }

    type ActionResponse<T> = {
        data: T | null;
        error: string | null;
    };
}
