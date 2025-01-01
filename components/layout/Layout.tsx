import { Footer } from './Footer';
import { Header } from './Header';
import './../../pages/globals.css';

export const RootLayout = ({ children }: { children: React.JSX.Element }) => {
	return (
		<main className='min-w-[500px] min-h-screen flex flex-col'>
			<Header />
			<div className='p-8 flex-grow'>{children}</div>
			<Footer />
		</main>
	);
};
