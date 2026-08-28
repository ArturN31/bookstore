import { useRef, useState, useEffect, useCallback } from 'react';

export const useCarouselScroll = (itemCount: number) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
    const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

    const checkScrollPosition = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        setCanScrollLeft(scrollLeft > 5);
        setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5);
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        checkScrollPosition();

        const resizeObserver = new ResizeObserver(() => {
            checkScrollPosition();
        });

        resizeObserver.observe(container);
        container.addEventListener('scroll', checkScrollPosition, { passive: true });

        return () => {
            resizeObserver.disconnect();
            container.removeEventListener('scroll', checkScrollPosition);
        };
    }, [checkScrollPosition, itemCount]);

    const handleScroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollAmount = container.clientWidth * 0.75;
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    };

    return {
        scrollContainerRef,
        canScrollLeft,
        canScrollRight,
        handleScroll,
    };
};
