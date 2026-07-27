import { useBookFilter } from '@/providers/advancedFiltering/BookAdvancedFilteringProvider';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Button } from '@mui/material';

export const FilteringSidebarResetButtonSection = () => {
    const { resetAllFilters } = useBookFilter();

    return (
        <div className="flex items-center justify-end bg-gray-50 px-4 py-2">
            <Button
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={resetAllFilters}
                className="text-[0.8125rem] text-gray-500 normal-case hover:text-red-600"
            >
                Reset All Filters
            </Button>
        </div>
    );
};
