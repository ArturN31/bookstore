import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Suspense } from 'react';
import { SessionProviderWrapper } from '@/components/layout/SessionProviderWrapper';
import { LayoutSkeleton } from '@/components/layout/LayoutSkeleton';
import { FilteringSidebar } from '../FilteringSidebar/FilteringSidebar';

export const RootLayoutContent = ({ children }: { children: React.ReactNode }) => {
    return (
        <Suspense fallback={<LayoutSkeleton />}>
            <SessionProviderWrapper>
                <div
                    className="flex min-h-screen flex-col"
                    data-testid="root-layout-wrapper"
                >
                    <Header />
                    <main className="flex w-full flex-1 flex-row gap-8 bg-slate-50 md:flex">
                        <FilteringSidebar />
                        <div className="flex w-full flex-1 flex-col py-8">{children}</div>
                    </main>
                    <Footer />
                </div>
            </SessionProviderWrapper>
        </Suspense>
    );
};
