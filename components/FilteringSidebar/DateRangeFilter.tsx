import { FilteringTypes } from '@/data/advancedFiltering/FilteringConstants';
import { useBookFilter } from '@/providers/advancedFiltering/BookAdvancedFilteringProvider';
import { Box, TextField } from '@mui/material';
import { ChangeEvent, useMemo, useState } from 'react';

interface DateRangeFilterProps {
    category: keyof FilteringTypes;
    values: string[];
}

export const DateRangeFilter = ({ category, values }: DateRangeFilterProps) => {
    const { chosenFilters, setChosenFilters } = useBookFilter();

    const sortedDates = useMemo(() => {
        return values
            .map((v) => String(v).slice(0, 10))
            .filter((v) => !isNaN(Date.parse(v)))
            .sort();
    }, [values]);

    const minDate = sortedDates[0] || '';
    const maxDate = sortedDates[sortedDates.length - 1] || '';

    const activeFilterDates = chosenFilters[category] as string[] | undefined;

    const [prevActiveFilterDates, setPrevActiveFilterDates] = useState(activeFilterDates);
    const [prevMinDate, setPrevMinDate] = useState(minDate);
    const [prevMaxDate, setPrevMaxDate] = useState(maxDate);

    const [startDate, setStartDate] = useState<string>(() => {
        if (Array.isArray(activeFilterDates) && activeFilterDates[0]) {
            return activeFilterDates[0];
        }
        return minDate;
    });

    const [endDate, setEndDate] = useState<string>(() => {
        if (Array.isArray(activeFilterDates) && activeFilterDates[1]) {
            return activeFilterDates[1];
        }
        return maxDate;
    });

    if (
        activeFilterDates !== prevActiveFilterDates ||
        minDate !== prevMinDate ||
        maxDate !== prevMaxDate
    ) {
        setPrevActiveFilterDates(activeFilterDates);
        setPrevMinDate(minDate);
        setPrevMaxDate(maxDate);

        setStartDate(
            Array.isArray(activeFilterDates) && activeFilterDates[0]
                ? activeFilterDates[0]
                : minDate,
        );
        setEndDate(
            Array.isArray(activeFilterDates) && activeFilterDates[1]
                ? activeFilterDates[1]
                : maxDate,
        );
    }

    const handleStartChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newStart = e.target.value;
        setStartDate(newStart);
        setChosenFilters((prev) => ({
            ...prev,
            [category]: [newStart, endDate],
        }));
    };

    const handleEndChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newEnd = e.target.value;
        setEndDate(newEnd);
        setChosenFilters((prev) => ({
            ...prev,
            [category]: [startDate, newEnd],
        }));
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
