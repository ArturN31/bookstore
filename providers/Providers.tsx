'use client';

import { BookFilterProvider } from './BookFilterProvider';
import { CartProvider } from './CartProvider';
import { UserProvider } from './UserProvider';

export const Providers = ({ children }: { children: React.ReactNode }) => {
	return (
		<UserProvider>
			<CartProvider>
				<BookFilterProvider>{children}</BookFilterProvider>
			</CartProvider>
		</UserProvider>
	);
};
