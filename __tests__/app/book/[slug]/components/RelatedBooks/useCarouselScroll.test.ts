import { renderHook, act } from '@testing-library/react';
import { useCarouselScroll } from '@/app/book/[slug]/components/RelatedBooks/useCarouselScroll';

type ResizeCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;

let resizeCallback: ResizeCallback | undefined;

class MockResizeObserver implements ResizeObserver {
    constructor(callback: ResizeCallback) {
        resizeCallback = callback;
    }
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
}

describe('useCarouselScroll Hook', () => {
    let originalResizeObserver: typeof window.ResizeObserver;

    beforeAll(() => {
        originalResizeObserver = window.ResizeObserver;
        window.ResizeObserver = MockResizeObserver;
    });

    afterAll(() => {
        window.ResizeObserver = originalResizeObserver;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        resizeCallback = undefined;
    });

    it('should return initial scroll states', () => {
        const { result } = renderHook(() => useCarouselScroll(5));

        expect(result.current.canScrollLeft).toBe(false);
        expect(result.current.canScrollRight).toBe(true);
        expect(result.current.scrollContainerRef.current).toBeNull();
    });

    it('should attach ResizeObserver and scroll event listener when container is present', () => {
        const mockContainer = document.createElement('div');
        const addEventListenerSpy = jest.spyOn(mockContainer, 'addEventListener');
        const removeEventListenerSpy = jest.spyOn(mockContainer, 'removeEventListener');

        Object.defineProperties(mockContainer, {
            scrollLeft: { value: 0, writable: true },
            scrollWidth: { value: 1000, writable: true },
            clientWidth: { value: 500, writable: true },
        });

        const { result, rerender, unmount } = renderHook(
            ({ itemCount }: { itemCount: number }) => useCarouselScroll(itemCount),
            { initialProps: { itemCount: 5 } },
        );

        (
            result.current.scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = mockContainer;

        rerender({ itemCount: 10 });

        expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
            passive: true,
        });

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    it('should update scroll state when ResizeObserver callback is invoked', () => {
        const mockContainer = document.createElement('div');

        Object.defineProperties(mockContainer, {
            scrollLeft: { value: 15, writable: true },
            scrollWidth: { value: 1000, writable: true },
            clientWidth: { value: 500, writable: true },
        });

        const { result, rerender } = renderHook(
            ({ itemCount }: { itemCount: number }) => useCarouselScroll(itemCount),
            { initialProps: { itemCount: 5 } },
        );

        (
            result.current.scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = mockContainer;

        rerender({ itemCount: 6 });

        act(() => {
            if (resizeCallback) {
                resizeCallback([], {} as ResizeObserver);
            }
        });

        expect(result.current.canScrollLeft).toBe(true);
        expect(result.current.canScrollRight).toBe(true);
    });

    it('should early return in checkScrollPosition when scrollContainerRef is null', () => {
        const mockContainer = document.createElement('div');

        Object.defineProperties(mockContainer, {
            scrollLeft: { value: 20, writable: true },
            scrollWidth: { value: 1000, writable: true },
            clientWidth: { value: 500, writable: true },
        });

        const { result, rerender } = renderHook(
            ({ itemCount }: { itemCount: number }) => useCarouselScroll(itemCount),
            { initialProps: { itemCount: 5 } },
        );

        (
            result.current.scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = mockContainer;

        rerender({ itemCount: 6 });

        expect(result.current.canScrollLeft).toBe(true);

        (
            result.current.scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = null;

        Object.defineProperty(mockContainer, 'scrollLeft', { value: 0 });

        act(() => {
            if (resizeCallback) {
                resizeCallback([], {} as ResizeObserver);
            }
        });

        expect(result.current.canScrollLeft).toBe(true);
    });

    it('should update scroll state correctly when scroll position changes', () => {
        const mockContainer = document.createElement('div');

        Object.defineProperties(mockContainer, {
            scrollLeft: { value: 20, writable: true },
            scrollWidth: { value: 1000, writable: true },
            clientWidth: { value: 500, writable: true },
        });

        const { result, rerender } = renderHook(
            ({ itemCount }: { itemCount: number }) => useCarouselScroll(itemCount),
            { initialProps: { itemCount: 5 } },
        );

        (
            result.current.scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = mockContainer;

        rerender({ itemCount: 6 });

        act(() => {
            const scrollEvent = new Event('scroll');
            mockContainer.dispatchEvent(scrollEvent);
        });

        expect(result.current.canScrollLeft).toBe(true);
        expect(result.current.canScrollRight).toBe(true);
    });

    it('should call scrollBy with smooth behavior on right scroll', () => {
        const mockScrollBy = jest.fn();
        const mockContainer = document.createElement('div');
        mockContainer.scrollBy = mockScrollBy;

        Object.defineProperties(mockContainer, {
            clientWidth: { value: 400, writable: true },
        });

        const { result } = renderHook(() => useCarouselScroll(5));

        (
            result.current.scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = mockContainer;

        act(() => {
            result.current.handleScroll('right');
        });

        expect(mockScrollBy).toHaveBeenCalledWith({
            left: 300,
            behavior: 'smooth',
        });
    });

    it('should call scrollBy with smooth behavior on left scroll', () => {
        const mockScrollBy = jest.fn();
        const mockContainer = document.createElement('div');
        mockContainer.scrollBy = mockScrollBy;

        Object.defineProperties(mockContainer, {
            clientWidth: { value: 400, writable: true },
        });

        const { result } = renderHook(() => useCarouselScroll(5));

        (
            result.current.scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = mockContainer;

        act(() => {
            result.current.handleScroll('left');
        });

        expect(mockScrollBy).toHaveBeenCalledWith({
            left: -300,
            behavior: 'smooth',
        });
    });

    it('should do nothing in handleScroll when scrollContainerRef is null', () => {
        const { result } = renderHook(() => useCarouselScroll(5));

        expect(() => {
            act(() => {
                result.current.handleScroll('right');
            });
        }).not.toThrow();
    });
});
