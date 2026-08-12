import { ReviewFormCommentInput } from '@/components/pages/book/Reviews/ReviewForm/FormItems/ReviewFormCommentInput';
import { render, screen, fireEvent } from '@testing-library/react';

describe('ReviewFormCommentInput', () => {
    it('should render review details text field with label and placeholder', () => {
        const setComment = jest.fn();
        render(
            <ReviewFormCommentInput
                comment=""
                setComment={setComment}
            />,
        );

        const textField = screen.getByRole('textbox', { name: /review details/i });
        expect(textField).toBeInTheDocument();
        expect(textField).toHaveAttribute('placeholder', 'Describe your experience...');
    });

    it('should call setComment when text is entered', () => {
        const setComment = jest.fn();
        render(
            <ReviewFormCommentInput
                comment=""
                setComment={setComment}
            />,
        );

        const textField = screen.getByRole('textbox', { name: /review details/i });
        fireEvent.change(textField, { target: { value: 'Great book!' } });

        expect(setComment).toHaveBeenCalledWith('Great book!');
    });
});
