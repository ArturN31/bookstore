import { Header } from './Header';
import { Footer } from './Footer';
import { Suspense } from 'react';
import { SessionProviderWrapper } from './SessionProviderWrapper';
import { BookFilterProvider } from '@/providers/BookFilterProvider';
import { LayoutSkeleton } from './LayoutSkeleton';

export const RootLayoutContent = ({ children }: { children: React.ReactNode }) => {
    return (
        <BookFilterProvider>
            <Suspense fallback={<LayoutSkeleton />}>
                <SessionProviderWrapper>
                    <div
                        className="flex min-h-screen flex-col"
                        data-testid="root-layout-wrapper"
                    >
                        <Header />
                        <main className="flex-1 p-8">{children}</main>
                        <Footer />
                    </div>
                </SessionProviderWrapper>
            </Suspense>
        </BookFilterProvider>
    );
};
