'use client';

import { BookFilterProvider } from './BookFilterProvider';

export const Providers = ({ children }: { children: React.ReactNode }) => {
	return <BookFilterProvider>{children}</BookFilterProvider>;
};
