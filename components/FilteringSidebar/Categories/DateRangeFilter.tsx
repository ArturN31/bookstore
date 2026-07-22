import { FilteringTypes } from '@/data/advancedFiltering/FilteringConstants';
import { useCategoryFilter } from '@/data/advancedFiltering/useCategoryFilter';
import { Box, TextField } from '@mui/material';
import { ChangeEvent, useMemo } from 'react';

interface DateRangeFilterProps<K extends keyof FilteringTypes> {
    category: K;
    values: string[];
}

export const DateRangeFilter = <K extends keyof FilteringTypes>({
    category,
    values,
}: DateRangeFilterProps<K>) => {
    const { categoryValue, setValue } = useCategoryFilter(category);

    const sortedDates = useMemo(() => {
        return values
            .map((v) => String(v).slice(0, 10))
            .filter((v) => !isNaN(Date.parse(v)))
            .sort();
    }, [values]);

    const minDate = sortedDates[0] || '';
    const maxDate = sortedDates[sortedDates.length - 1] || '';

    const activeFilterDates = categoryValue as string[] | undefined;

    const startDate =
        Array.isArray(activeFilterDates) && Boolean(activeFilterDates[0])
            ? activeFilterDates[0]
            : minDate;

    const endDate =
        Array.isArray(activeFilterDates) && Boolean(activeFilterDates[1])
            ? activeFilterDates[1]
            : maxDate;

    const handleStartChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newStart = e.target.value;
        setValue([newStart, endDate] as FilteringTypes[K]);
    };

    const handleEndChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newEnd = e.target.value;
        setValue([startDate, newEnd] as FilteringTypes[K]);
    };

    return (
        <Box sx={{ display: 'flex', gap: 1, pt: 1, px: 0.5 }}>
            <TextField
                label="From"
                type="date"
                size="small"
                value={startDate}
                onChange={handleStartChange}
                slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: {
                        min: minDate,
                        max: endDate || maxDate,
                    },
                }}
                fullWidth
                sx={{
                    '& .MuiInputBase-input': {
                        fontSize: '0.8125rem',
                    },
                }}
            />
            <TextField
                label="To"
                type="date"
                size="small"
                value={endDate}
                onChange={handleEndChange}
                slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: {
                        min: startDate || minDate,
                        max: maxDate,
                    },
                }}
                fullWidth
                sx={{
                    '& .MuiInputBase-input': {
                        fontSize: '0.8125rem',
                    },
                }}
            />
        </Box>
    );
};
