'use client';

import { ReactNode, useState } from 'react';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import { useBookFilter } from '@/providers/advancedFiltering/BookAdvancedFilteringProvider';
import { FilteringSidebarSkeleton } from './FilteringSidebarSkeleton';
import { FilteringSidebarHeader } from './Sections/FilteringSidebarHeader';
import { FilteringSidebarResetButtonSection } from './Sections/FilteringSidebarResetButtonSection';
import { FilteringSidebarCategoriesContainer } from './Sections/FilteringSidebarCategoriesContainer';
import { FilteringSidebarButton } from './Sections/FilteringSidebarButton';

export const FilteringSidebar = () => {
    const { isLoading } = useBookFilter();
    const [open, setOpen] = useState<boolean>(false);

    const handleClose = () => {
        setOpen(false);
    };

    const handleOpen = () => {
        setOpen(true);
    };

    if (isLoading) return <FilteringSidebarSkeleton />;

    return (
        <>
            <FilteringSidebarButton handleOpen={handleOpen} />

            <Drawer
                anchor="left"
                open={open}
                onClose={handleClose}
                slotProps={{
                    paper: {
                        className: 'w-full sm:w-[360px] p-0 box-border flex flex-col h-full',
                    },
                }}
            >
                <FilteringSidebarHeader handleClose={handleClose} />

                <Divider />

                <FilteringSidebarResetButtonSection />

                <Divider />

                <FilteringSidebarCategoriesContainer />
            </Drawer>
        </>
    );
};
