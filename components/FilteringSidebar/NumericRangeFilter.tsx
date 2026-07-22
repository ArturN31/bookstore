import { FilteringTypes } from '@/data/advancedFiltering/FilteringConstants';
import { useBookFilter } from '@/providers/advancedFiltering/BookAdvancedFilteringProvider';
import { Box, Slider, Typography } from '@mui/material';
import { SyntheticEvent, useMemo, useState } from 'react';

interface NumericRangeFilterProps {
    category: keyof FilteringTypes;
    values: number[];
}

export const NumericRangeFilter = ({ category, values }: NumericRangeFilterProps) => {
    const { chosenFilters, setChosenFilters } = useBookFilter();

    const min = useMemo(() => (values.length ? Math.min(...values) : 0), [values]);
    const max = useMemo(() => (values.length ? Math.max(...values) : 100), [values]);

    const activeFilterRange = chosenFilters[category] as number[] | undefined;

    const [prevActiveFilterRange, setPrevActiveFilterRange] = useState(activeFilterRange);
    const [prevMin, setPrevMin] = useState(min);
    const [prevMax, setPrevMax] = useState(max);

    const [range, setRange] = useState<number[]>(() => {
        if (Array.isArray(activeFilterRange) && activeFilterRange.length === 2) {
            return activeFilterRange;
        }
        return [min, max];
    });

    if (activeFilterRange !== prevActiveFilterRange || min !== prevMin || max !== prevMax) {
        setPrevActiveFilterRange(activeFilterRange);
        setPrevMin(min);
        setPrevMax(max);
        setRange(
            Array.isArray(activeFilterRange) && activeFilterRange.length === 2
                ? activeFilterRange
                : [min, max],
        );
    }

    const isPrice = category === 'PRICES';

    const formatValue = (val: number) => (isPrice ? `£${val.toFixed(2)}` : val.toLocaleString());

    const handleSliderChange = (_: Event | SyntheticEvent, newValue: number | number[]) => {
        if (Array.isArray(newValue)) {
            setRange(newValue);
        }
    };

    const handleSliderCommitted = (_: Event | SyntheticEvent, newValue: number | number[]) => {
        if (Array.isArray(newValue)) {
            setChosenFilters((prev) => ({
                ...prev,
                [category]: newValue,
            }));
        }
    };

    return (
        <Box sx={{ px: 1, pt: 1, pb: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 'bold' }}
                >
                    {formatValue(range[0] ?? min)}
                </Typography>

                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 'bold' }}
                >
                    {formatValue(range[1] ?? max)}
                </Typography>
            </Box>

            <Slider
                value={range}
                onChange={handleSliderChange}
                onChangeCommitted={handleSliderCommitted}
                valueLabelDisplay="auto"
                valueLabelFormat={formatValue}
                min={min}
                max={max}
                size="small"
                sx={{
                    color: 'primary.main',
                    '& .MuiSlider-thumb': {
                        width: 16,
                        height: 16,
                    },
                }}
            />
        </Box>
    );
};
