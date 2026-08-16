import { PasswordField } from '@/components/formItems/PasswordField';
import { screen, render, fireEvent } from '@testing-library/react';

jest.mock('@/data/advancedFiltering/FilteringConstants', () => ({
    DEFAULT_FILTERING_CONSTANTS: {
        categories: [],
        tags: [],
    },
    getFilteringConstants: jest.fn().mockResolvedValue({
        categories: [],
        tags: [],
    }),
}));

describe('APP - FormItems - PasswordField', () => {
    it('should handle visibility change', () => {
        render(
            <PasswordField
                id="password"
                label="Password"
                placeholder="Password"
                value="123"
                onChange={jest.fn()}
            />,
        );

        const input = screen.getByLabelText(/password/i);
        expect(input).toHaveValue('123');

        const visibilityBtn = screen.getByRole('button');
        fireEvent.click(visibilityBtn);

        expect(screen.getByRole('textbox')).toHaveValue('123');
    });
});
