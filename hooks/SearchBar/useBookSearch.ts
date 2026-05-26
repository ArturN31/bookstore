import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';

export const useBookSearch = () => {
    const [input, setInput] = useState('');
    const [searchResults, setSearchResults] = useState<Book[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);

    const clearSearch = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setInput('');
        setSearchResults([]);
        setErrorMessage(null);
        setIsLoading(false);
    };

    const fetchAndFilterBooks = async (searchTerm: string) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);

        try {
            const response = await fetchBooksWithReviews({ limit: 50 });

            if (controller.signal.aborted) return;

            if (response.error || !response.data) {
                setErrorMessage(response.error ?? 'No books available to search.');
                setSearchResults([]);
                return;
            }

            const allBooks = response.data.data ?? [];
            const filteredBooks = allBooks
                .filter((book: Book) => book.is_active)
                .filter(
                    (book: Book) =>
                        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        book.author?.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .slice(0, 10);

            setSearchResults(filteredBooks);
            setErrorMessage(filteredBooks.length === 0 ? 'No matching books found.' : null);
        } catch (error) {
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
                setErrorMessage('Failed to retrieve books. Please try again later.');
                setSearchResults([]);
            }
        } finally {
            if (abortControllerRef.current === controller) {
                setIsLoading(false);
            }
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setInput(value);

        if (!value.trim()) {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
            setSearchResults([]);
            setErrorMessage(null);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const trimmedInput = input.trim();
        if (!trimmedInput) return;

        const delaySearch = setTimeout(() => {
            fetchAndFilterBooks(trimmedInput);
        }, 600);

        return () => clearTimeout(delaySearch);
    }, [input]);

    return {
        input,
        searchResults,
        errorMessage,
        isLoading,
        handleInputChange,
        clearSearch,
        setSearchResults,
    };
};
