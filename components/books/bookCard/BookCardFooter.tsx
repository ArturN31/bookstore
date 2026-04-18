import { CartActionForm } from '@/components/CartForms/CartActionForm';

export const BookCardFooter = ({ book }: { book: Book }) => {
    return (
        <div className="1080p:px-5 1080p:pb-6 4k:px-10 4k:pb-12 px-3 pb-4">
            <div className="mb-4 flex items-center gap-3 opacity-20">
                <div className="h-px grow bg-slate-900" />
                <span className="1080p:text-[9px] 4k:text-xl text-[8px] font-black tracking-[0.3em] text-slate-900 uppercase">
                    {book.format}
                </span>
                <div className="h-px grow bg-slate-900" />
            </div>

            <div onClick={(e) => e.stopPropagation()}>
                <CartActionForm
                    bookID={book.id}
                    stock={book.stock_quantity}
                />
            </div>
        </div>
    );
};
