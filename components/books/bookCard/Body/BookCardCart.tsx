import { CartActionForm } from '@/components/CartForms/CartActionForm';

export const BookCardCart = ({ book }: { book: Book }) => {
    return (
        <div className="bg-gunmetal grid min-h-25 place-content-center gap-2 py-2 text-white">
            <p className="text-center text-xs font-light">{book.format}</p>

            <CartActionForm
                bookID={book.id}
                stock={book.stock_quantity}
            />
        </div>
    );
};
