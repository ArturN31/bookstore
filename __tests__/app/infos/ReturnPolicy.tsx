import ReturnPolicy from '@/app/infos/returnpolicy/page';
import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
	useRouter: jest.fn(() => ({
		push: jest.fn(),
		replace: jest.fn(),
		refresh: jest.fn(),
		prefetch: jest.fn(),
		back: jest.fn(),
	})),
}));

jest.mock('@/providers/CartProvider', () => ({
	useCartState: jest.fn(() => ({
		cartBooks: [],
		loading: false,
	})),
}));

jest.mock('@/app/layout', () => ({
	Layout: ({ children }: { children: React.ReactNode }) => (
		<div data-testid='mock-layout'>{children}</div>
	),
}));

describe('APP - Infos - ReturnPolicy', () => {
	it('Should render the page', async () => {
		const element = ReturnPolicy();
		render(element);
		const header = await screen.findByTestId('return-policy-header');
		expect(header).toBeInTheDocument();
	});
});
