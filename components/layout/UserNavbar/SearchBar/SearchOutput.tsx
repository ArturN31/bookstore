import { useRouter } from 'next/navigation';

export const SearchOutput = ({
    books,
    errorMessage,
    onClose,
    activeIndex,
    isLoading,
}: {
    books: Book[];
    errorMessage: string | null;
    onClose: () => void;
    activeIndex: number;
    isLoading: boolean;
}) => {
    const router = useRouter();

    if (errorMessage)
        return (
            <div
                role="alert"
                data-testid="searchbar-searchoutput-error"
                className="absolute z-40 mt-12 w-full rounded-md border border-red-500 bg-white p-4 text-center font-medium text-red-700"
            >
                {errorMessage}
            </div>
        );

    return (
        <div
            id="search-results"
            role="listbox"
            data-testid="searchbar-searchoutput"
            className="absolute z-40 w-75 rounded-md border border-gray-300 bg-white shadow-lg"
        >
            {isLoading ? (
                <div className="flex items-center justify-center gap-2 p-4 text-gray-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                    Searching...
                </div>
            ) : books.length === 0 ? (
                <div className="p-4 text-center text-gray-700">No books found.</div>
            ) : (
                books.map((book, index) => (
                    <button
                        key={book.id}
                        role="option"
                        aria-selected={index === activeIndex}
                        onClick={() => {
                            onClose();
                            router.push(`/book/${book.id}`);
                        }}
                        className={`w-full cursor-pointer border-b border-gray-100 px-4 py-3 text-left text-slate-900 transition-colors first:rounded-t-md last:rounded-b-md last:border-b-0 ${index === activeIndex ? 'bg-slate-200' : 'hover:bg-slate-100'} `}
                    >
                        {book.title}
                    </button>
                ))
            )}
        </div>
    );
};
