import { Footer } from './Footer';
import { Header } from './Header';
import './../../app/globals.css';
import { Providers } from '@/providers/Providers';

export const RootLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<Providers>
			<div
				className='min-h-screen flex flex-col'
				data-testid='root-layout-wrapper'>
				<Header />
				<main
					className='p-8 flex-1'
					data-testid='main-content'>
					{children}
				</main>
				<Footer />
			</div>
		</Providers>
	);
};
