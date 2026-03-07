/**
 * BASE SCHEMAS
 * Representing the data as it inserted into database
 */

interface BookDB {
    id?: string;
    title: string;
    author: string;
    genre: string;
    publisher: string;
    publication_date: string;
    price: string;
    description: string;
    format: string;
    page_count: number;
    image_url: string;
    stock_quantity: number;
    is_active: boolean;
    sales_count: number;
}

interface ReviewDB {
    id?: string;
    created_at?: string;
    updated_at?: string;
    book_id: string;
    user_id: string;
    username: string;
    review: string;
    rating: number;
}

interface UserDB {
    id: string;
    created_at?: string;
    updated_at?: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    street_address: string;
    postcode: string;
    city: string;
    country: string;
    phone_number: string;
    username: string;
}

type PaymentMethod =
    | 'Credit Card'
    | 'Debit Card'
    | 'PayPal'
    | 'Apple Pay'
    | 'Google Pay'
    | 'Stripe';

interface OrderDB {
    id?: string;
    created_at?: string;
    user_id: string;
    total_amount: number;
    status: 'pending' | 'completed' | 'cancelled' | 'shipped';
    payment_method: PaymentMethod;
}

interface OrderItemDB {
    id?: string;
    created_at?: string;
    order_id: string;
    book_id: string;
    quantity: number;
    price: number;
}

interface OrderDiscountDB {
    id?: string;
    order_id: string;
    discount_id: string;
}

interface DiscountDB {
    id?: string;
    created_at?: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

interface CartItemDB {
    id?: string;
    created_at?: string;
    cart_id: string;
    book_id: string;
    quantity: number;
}

/**
 * APP ENTITIES
 * Extends base schemas with database-generated fields
 */
interface Book extends BookDB {
    id: string;
    created_at: string;
    updated_at: string;
    // optional enriched data from server-side mapping
    reviews?: Review[];
    rating?: number;
}

interface User extends UserDB {
    email: string;
}

interface OrderDiscount extends OrderDiscountDB {
    discount_amount: number;
}

/**
 * FEATURE SPECIFIC TYPES
 */

interface Wishlist {
    id: string;
    created_at: string;
    user_id: string;
    book_id: string;
}

interface Cart {
    cartBooks: CartItem[];
    cartBooksAmount: number; //sum of quantities
    cartItemsAmount: number; //distinct items count
    cartTotal: number;
    cartID: string | null;
    loading: boolean;
}

interface CartItem extends Book {
    quantity: number;
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
