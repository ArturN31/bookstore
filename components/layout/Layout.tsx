import { Footer } from './Footer';
import { Header } from './Header';
import './../../pages/globals.css';

export const RootLayout = ({ children }: { children: React.JSX.Element }) => {
	return (
		<>
			<Header />
			<main className='p-8'>{children}</main>
			<Footer />
		</>
	);
};
