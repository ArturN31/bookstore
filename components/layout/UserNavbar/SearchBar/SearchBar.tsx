'use client';

import { SearchOutput } from '@/components/layout/UserNavbar/SearchBar/SearchOutput';
import { ChangeEvent, useEffect, useState, useRef } from 'react';
import { SearchInput } from '@/components/layout/UserNavbar/SearchBar/SearchInput';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { useRouter } from 'next/navigation';

export const SearchBar = () => {
    const [input, setInput] = useState('');
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [searchResults, setSearchResults] = useState<Book[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setInput(value);
        setIsDropdownVisible(true);
        setErrorMessage(null);
        if (value) setIsLoading(true);
    };

    const clearSearch = () => {
        setInput('');
        setIsDropdownVisible(false);
        setActiveIndex(-1);
        setSearchResults([]);
    };

    const fetchAndFilterBooks = async (searchTerm: string) => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
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
            setIsDropdownVisible(true);
        } catch (error) {
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
                setErrorMessage('Failed to retrieve books. Please try again later.');
                setSearchResults([]);
            }
        } finally {
            if (!controller.signal.aborted) setIsLoading(false);
        }
    };

    const handleBlur = (e: React.FocusEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setTimeout(() => {
                setIsDropdownVisible(false);
                setActiveIndex(-1);
            }, 200);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsDropdownVisible(false);
            setActiveIndex(-1);
        }

        if (isDropdownVisible && searchResults.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
            } else if (e.key === 'Enter' && activeIndex !== -1) {
                e.preventDefault();
                const selectedBook = searchResults[activeIndex];
                router.push(`/book/${selectedBook.id}`);
                clearSearch();
            }
        }
    };

    useEffect(() => {
        if (input.trim()) {
            const delaySearch = setTimeout(() => {
                fetchAndFilterBooks(input.trim());
            }, 600);
            return () => clearTimeout(delaySearch);
        } else {
            setIsLoading(false);
            setSearchResults([]);
            setErrorMessage(null);
            setActiveIndex(-1);
        }
    }, [input]);

    return (
        <div
            className="relative"
            role="combobox"
            data-testid="searchbar"
            aria-expanded={isDropdownVisible}
            aria-haspopup="listbox"
            aria-controls="search-results"
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
        >
            <SearchInput
                input={input}
                handleInput={handleInputChange}
            />
            <div
                aria-live="polite"
                className="relative min-h-10 w-75"
            >
                {input && isDropdownVisible && (
                    <SearchOutput
                        books={searchResults}
                        errorMessage={errorMessage}
                        activeIndex={activeIndex}
                        onClose={clearSearch}
                        isLoading={isLoading}
                    />
                )}
            </div>
        </div>
    );
};
