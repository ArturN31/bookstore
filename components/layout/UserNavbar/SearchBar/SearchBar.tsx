'use client';

import { SearchOutput } from '@/components/layout/UserNavbar/SearchBar/SearchOutput';
import { ChangeEvent, useEffect, useState } from 'react';
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
    };

    const fetchAndFilterBooks = async (searchTerm: string) => {
        setIsLoading(true);

        try {
            const allBooks = await fetchBooksWithReviews();
            if (!allBooks) {
                setErrorMessage('No books available to search.');
                setIsDropdownVisible(true);
                return;
            }

            const filteredBooks = allBooks.data
                .filter((book: Book) => book.is_active)
                .filter((book: Book) => book.title.toLowerCase().includes(searchTerm.toLowerCase()))
                .slice(0, 10);

            setSearchResults(filteredBooks);
            setIsDropdownVisible(true);
        } catch (error) {
            setErrorMessage('Failed to retrieve books. Please try again later.');
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBlur = (e: React.FocusEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDropdownVisible(false);
            setActiveIndex(-1);
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
        if (input) {
            const delaySearch = setTimeout(() => {
                fetchAndFilterBooks(input);
            }, 1000);
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
            onMouseEnter={() => input && setIsDropdownVisible(true)}
            onMouseLeave={() => setIsDropdownVisible(false)}
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
