import { Footer } from './Footer';
import { Header } from './Header';
import './../../app/globals.css';
import { Providers } from '@/providers/Providers';

export const RootLayout = ({ children }: { children: React.JSX.Element }) => {
	return (
		<Providers>
			<main className='min-h-screen flex flex-col'>
				<Header />
				<div className='p-8 flex-1'>{children}</div>
				<Footer />
			</main>
		</Providers>
	);
};
