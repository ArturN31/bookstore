import { UserReviewHeader } from '@/app/user/content/reviews/components/UserReviewHeader';
import { render, screen } from '@testing-library/react';

describe('UserReviewHeader', () => {
    const bookId = '123';

    it('should return null when bookData is null or undefined', () => {
        const { container } = render(
            <UserReviewHeader
                bookId={bookId}
                bookData={null}
            />,
        );
        expect(container.firstChild).toBeNull();

        const { container: containerUndefined } = render(
            <UserReviewHeader
                bookId={bookId}
                bookData={undefined}
            />,
        );
        expect(containerUndefined.firstChild).toBeNull();
    });

    it('should return null when bookData lacks a title', () => {
        const { container } = render(
            <UserReviewHeader
                bookId={bookId}
                bookData={{ author: 'Test Author' }}
            />,
        );
        expect(container.firstChild).toBeNull();
    });

    it('should render title and view book link correctly when bookData has a title', () => {
        render(
            <UserReviewHeader
                bookId={bookId}
                bookData={{ title: 'Test Book Title' }}
            />,
        );

        const titleLink = screen.getByRole('link', { name: 'Test Book Title' });
        expect(titleLink).toBeInTheDocument();
        expect(titleLink).toHaveAttribute('href', `/book/${bookId}`);

        const viewBookLink = screen.getByRole('link', { name: /view book/i });
        expect(viewBookLink).toBeInTheDocument();
        expect(viewBookLink).toHaveAttribute('href', `/book/${bookId}`);

        expect(screen.queryByText(/by /)).not.toBeInTheDocument();
    });

    it('should render author when provided in bookData', () => {
        render(
            <UserReviewHeader
                bookId={bookId}
                bookData={{ title: 'Test Book Title', author: 'John Doe' }}
            />,
        );

        expect(screen.getByText('Test Book Title')).toBeInTheDocument();
        expect(screen.getByText(/by/i)).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
});
