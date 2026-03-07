import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Footer } from '../../../components/layout/Footer';

describe('RootLayout - Footer', () => {
    beforeEach(() => {
        render(<Footer />);
    });

    it('Renders mission', () => {
        const mission = screen.getByTestId('footer-mission');
        expect(mission).toHaveTextContent(
            'We want to provide readers with a convenient and affordable way to access a vast library of digital books. We strive to offer a diverse selection of genres, exclusive titles, and exceptional customer service, ensuring a seamless and enjoyable reading experience for all.',
        );
    });

    it('Renders contact details', () => {
        const address = screen.getByTestId('footer-address');
        expect(address).toHaveTextContent('West Highland Way, Milngavie');
        expect(address).toHaveTextContent('Glasgow, G62 6PB');

        const number = screen.getByTestId('footer-number');
        expect(number).toHaveTextContent('+44 7911 123456');

        const email = screen.getByTestId('footer-email');
        expect(email).toHaveTextContent('books4you.contact@example.com');
    });

    it('Renders urls', () => {
        expect(screen.getByTestId('footer-return-policy')).toHaveTextContent('Return Policy');
        expect(screen.getByTestId('footer-privacy-policy')).toHaveTextContent('Privacy Policy');
        expect(screen.getByTestId('footer-terms-of-service')).toHaveTextContent('Terms of Service');
        expect(screen.getByTestId('footer-shipping-information')).toHaveTextContent(
            'Shipping Information',
        );
    });

    it('Renders social media icons', () => {
        const linkedin = screen.getByLabelText('Follow us on LinkedIn');
        expect(linkedin).toBeInTheDocument();

        const facebook = screen.getByLabelText('Follow us on Facebook');
        expect(facebook).toBeInTheDocument();

        const instagram = screen.getByLabelText('Follow us on Instagram');
        expect(instagram).toBeInTheDocument();

        const x = screen.getByLabelText('Follow us on X');
        expect(x).toBeInTheDocument();
    });

    it('Renders copyright', () => {
        const copyright = screen.getByTestId('footer-copyright');
        const expectedText = `Books 4 You © ${new Date().getFullYear()}`;
        expect(copyright).toHaveTextContent(expectedText);
    });
});
