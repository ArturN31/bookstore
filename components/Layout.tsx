import { Footer } from './Footer';
import { Header } from './Header';

export const RootLayout = ({ children }: { children: React.JSX.Element }) => {
	return (
		<>
			<Header />
			<main>{children}</main>
			<Footer />
		</>
	);
};
