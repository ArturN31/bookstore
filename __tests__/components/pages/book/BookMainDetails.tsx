import { BookMainDetails } from '@/components/pages/book/BookMainDetails';
import { screen, render } from '@testing-library/react';

describe('APP - pages/book - BookMainDetails', () => {
    const mockProps = {
        stock: 20,
        title: 'Clarissa',
        author: 'Anton Pavlovich Chekhov',
        publicationDate: '2008-06-15',
        publisher: 'Da Capo Press',
        format: 'Audiobook',
        genre: 'Classic',
    };

    it('should render component with correct details', () => {
        render(<BookMainDetails {...mockProps} />);

        expect(screen.getByText(mockProps.title)).toBeInTheDocument();
        expect(screen.getByText(/Published:/i)).toBeInTheDocument();
        expect(screen.getByText(mockProps.publicationDate)).toBeInTheDocument();
        expect(screen.getByText(mockProps.publisher)).toBeInTheDocument();
    });
});
