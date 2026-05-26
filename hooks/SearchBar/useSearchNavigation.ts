import { useState, KeyboardEvent, FocusEvent } from 'react';
import { useRouter } from 'next/navigation';

export const useSearchNavigation = (searchResults: Book[], clearSearch: () => void) => {
    const router = useRouter();
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const handleBlur = (e: FocusEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setTimeout(() => {
                setIsDropdownVisible(false);
                setActiveIndex(-1);
            }, 200);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
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
                setIsDropdownVisible(false);
            }
        }
    };

    return {
        isDropdownVisible,
        setIsDropdownVisible,
        activeIndex,
        setActiveIndex,
        handleKeyDown,
        handleBlur,
    };
};
