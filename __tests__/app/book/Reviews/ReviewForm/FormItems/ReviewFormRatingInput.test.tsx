import { ReviewFormRatingInput } from '@/app/book/[slug]/components/Reviews/ReviewForm/FormItems/ReviewFormRatingInput';
import { render, screen, fireEvent } from '@testing-library/react';

describe('ReviewFormRatingInput', () => {
    it('should render rating question and current rating value', () => {
        const setRating = jest.fn();
        render(
            <ReviewFormRatingInput
                rating={3}
                setRating={setRating}
            />,
        );

        expect(screen.getByText('How would you rate this item?')).toBeInTheDocument();
        const ratingInput = screen.getByRole('radio', { name: /3 Stars/i });
        expect(ratingInput).toBeInTheDocument();
        expect(ratingInput).toBeChecked();
    });

    it('should call setRating when a new rating is selected', () => {
        const setRating = jest.fn();
        render(
            <ReviewFormRatingInput
                rating={null}
                setRating={setRating}
            />,
        );

        const starInput = screen.getByRole('radio', { name: /5 Stars/i });
        fireEvent.click(starInput);
        expect(setRating).toHaveBeenCalledWith(5);
    });
});
