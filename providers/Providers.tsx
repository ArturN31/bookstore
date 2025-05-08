'use client';

import { BookFilterProvider } from './BookFilterProvider';
import { UserProvider } from './UserProvider';

export const Providers = ({ children }: { children: React.ReactNode }) => {
	return (
		<UserProvider>
			<BookFilterProvider>{children}</BookFilterProvider>
		</UserProvider>
	);
};
