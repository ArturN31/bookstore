import { describe, it, expect } from '@jest/globals';
import { act, render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { Footer } from '../../components/layout/Footer';

describe('RootLayout - Footer', () => {
	beforeEach(async () => {
		await act(async () => {
			await render(<Footer />);
		});
	});

	it('Renders mission', () => {
		const mission = screen.getByTestId('footer-mission');
		expect(mission).toHaveTextContent(
			'We want to provide readers with a convenient and affordable way to access a vast library of digital books. We strive to offer a diverse selection of genres, exclusive titles, and exceptional customer service, ensuring a seamless and enjoyable reading experience for all.',
		);
	});

	it('Renders contact details', () => {
		const address = screen.getByTestId('footer-address');
		expect(address.childNodes.length).toBe(2);
		expect(address.childNodes[0]).toHaveTextContent('West Highland Way, Milngavie');
		expect(address.childNodes[1]).toHaveTextContent('Glasgow, G62 6PB');

		const number = screen.getByTestId('footer-number');
		expect(number).toHaveTextContent('+44 7911 123456');

		const email = screen.getByTestId('footer-email');
		expect(email).toHaveTextContent('books4you.contact@example.com');
	});

	it('Renders urls', () => {
		const returnPolicy = screen.getByTestId('footer-return-policy');
		expect(returnPolicy).toHaveTextContent('Return Policy');

		const privacyPolicy = screen.getByTestId('footer-privacy-policy');
		expect(privacyPolicy).toHaveTextContent('Privacy Policy');

		const tos = screen.getByTestId('footer-terms-of-service');
		expect(tos).toHaveTextContent('Terms of Service');

		const shippingInformation = screen.getByTestId('footer-shipping-information');
		expect(shippingInformation).toHaveTextContent('Shipping Information');
	});

	it('Renders social media icons', () => {
		const linkedin = screen.getByTestId('footer-linkedin');
		expect(linkedin).toHaveAttribute('data-testid', 'footer-linkedin');

		const facebook = screen.getByTestId('footer-facebook');
		expect(facebook).toHaveAttribute('data-testid', 'footer-facebook');

		const instagram = screen.getByTestId('footer-instagram');
		expect(instagram).toHaveAttribute('data-testid', 'footer-instagram');

		const x = screen.getByTestId('footer-x');
		expect(x).toHaveAttribute('data-testid', 'footer-x');
	});

	it('Renders copyright', () => {
		const copyright = screen.getByTestId('footer-copyright');
		const expectedText = `Books 4 You © ${new Date().getFullYear()}`;
		expect(copyright).toHaveTextContent(expectedText);
	});
});
