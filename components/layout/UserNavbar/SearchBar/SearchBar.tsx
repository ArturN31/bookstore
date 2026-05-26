'use client';

import { ChangeEvent } from 'react';
import { SearchInput } from '@/components/layout/UserNavbar/SearchBar/SearchInput';
import { SearchOutput } from '@/components/layout/UserNavbar/SearchBar/SearchOutput';
import { useBookSearch } from '@/hooks/SearchBar/useBookSearch';
import { useSearchNavigation } from '@/hooks/SearchBar/useSearchNavigation';

export const SearchBar = () => {
    const { input, searchResults, errorMessage, isLoading, handleInputChange, clearSearch } =
        useBookSearch();

    const { isDropdownVisible, setIsDropdownVisible, activeIndex, handleKeyDown, handleBlur } =
        useSearchNavigation(searchResults, clearSearch);

    const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        handleInputChange(e);
        if (e.target.value.trim()) setIsDropdownVisible(true);
    };

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
                handleInput={onInputChange}
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
