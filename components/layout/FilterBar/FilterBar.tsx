import dynamic from 'next/dynamic';
import { Home } from '@/components/layout/FilterBar/Home';
import { FilteringSidebar } from '@/components/FilteringSidebar/FilteringSidebar';

const SortBy = dynamic(
    () => import('@/components/layout/FilterBar/SortBy').then((mod) => mod.SortBy),
    { ssr: true },
);

export const FilterBar = () => {
    return (
        <nav
            className="sticky top-0 z-10 border-b border-gray-200 bg-gray-100"
            data-testid="filterbar"
            aria-label="Product Filters"
        >
            <div className="container mx-auto px-4">
                <ul className="-mb-px flex items-center justify-start overflow-x-auto">
                    <li className="shrink-0 bg-transparent px-4 py-2 text-gray-700 hover:text-blue-600 focus:outline-none">
                        <Home />
                    </li>
                    <li className="shrink-0 bg-transparent px-4 py-2 text-gray-700 hover:text-blue-600 focus:outline-none">
                        <SortBy />
                    </li>
                    <li className="shrink-0 bg-transparent px-4 py-2 text-gray-700 hover:text-blue-600 focus:outline-none">
                        <FilteringSidebar />
                    </li>
                </ul>
            </div>
        </nav>
    );
};
