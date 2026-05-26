import { useSearchNavigation } from '@/hooks/SearchBar/useSearchNavigation';
import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { KeyboardEvent, FocusEvent } from 'react';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

describe('useSearchNavigation', () => {
    const mockPush = jest.fn();
    const mockClearSearch = jest.fn();

    const mockBooks = [
        { id: '1', title: 'Book 1' },
        { id: '2', title: 'Book 2' },
    ] as Book[];

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should handle ArrowDown boundary conditions (Line 27)', () => {
        const { result } = renderHook(() => useSearchNavigation(mockBooks, mockClearSearch));
        act(() => {
            result.current.setIsDropdownVisible(true);
        });

        act(() => {
            result.current.handleKeyDown({
                key: 'ArrowDown',
                preventDefault: jest.fn(),
            } as unknown as KeyboardEvent);
        });
        expect(result.current.activeIndex).toBe(0);

        act(() => {
            result.current.handleKeyDown({
                key: 'ArrowDown',
                preventDefault: jest.fn(),
            } as unknown as KeyboardEvent);
        });
        expect(result.current.activeIndex).toBe(1);

        act(() => {
            result.current.handleKeyDown({
                key: 'ArrowDown',
                preventDefault: jest.fn(),
            } as unknown as KeyboardEvent);
        });
        expect(result.current.activeIndex).toBe(1);
    });

    it('should handle ArrowUp boundary conditions (Line 30)', () => {
        const { result } = renderHook(() => useSearchNavigation(mockBooks, mockClearSearch));
        act(() => {
            result.current.setIsDropdownVisible(true);
            result.current.setActiveIndex(1);
        });

        act(() => {
            result.current.handleKeyDown({
                key: 'ArrowUp',
                preventDefault: jest.fn(),
            } as unknown as KeyboardEvent);
        });
        expect(result.current.activeIndex).toBe(0);

        act(() => {
            result.current.handleKeyDown({
                key: 'ArrowUp',
                preventDefault: jest.fn(),
            } as unknown as KeyboardEvent);
        });
        expect(result.current.activeIndex).toBe(0);
    });

    it('should reset on Escape key', () => {
        const { result } = renderHook(() => useSearchNavigation(mockBooks, mockClearSearch));

        act(() => {
            result.current.setIsDropdownVisible(true);
            result.current.setActiveIndex(1);
        });

        act(() => {
            result.current.handleKeyDown({
                key: 'Escape',
                preventDefault: jest.fn(),
            } as unknown as KeyboardEvent);
        });

        expect(result.current.isDropdownVisible).toBe(false);
        expect(result.current.activeIndex).toBe(-1);
    });

    it('should trigger router.push on Enter', () => {
        const { result } = renderHook(() => useSearchNavigation(mockBooks, mockClearSearch));

        act(() => {
            result.current.setIsDropdownVisible(true);
            result.current.setActiveIndex(0);
        });

        act(() => {
            result.current.handleKeyDown({
                key: 'Enter',
                preventDefault: jest.fn(),
            } as unknown as KeyboardEvent);
        });

        expect(mockPush).toHaveBeenCalledWith('/book/1');
        expect(mockClearSearch).toHaveBeenCalled();
    });

    it('should close dropdown on Blur after timeout', () => {
        const { result } = renderHook(() => useSearchNavigation(mockBooks, mockClearSearch));
        const mockElement = { contains: jest.fn().mockReturnValue(false) };

        act(() => {
            result.current.setIsDropdownVisible(true);
            result.current.handleBlur({
                currentTarget: mockElement,
                relatedTarget: null,
            } as unknown as FocusEvent);
        });

        act(() => {
            jest.advanceTimersByTime(200);
        });

        expect(result.current.isDropdownVisible).toBe(false);
    });
});
