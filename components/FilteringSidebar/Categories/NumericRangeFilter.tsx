import { FilteringTypes } from '@/data/advancedFiltering/FilteringConstants';
import { useCategoryFilter } from '@/data/advancedFiltering/useCategoryFilter';
import { Box, Slider, Typography } from '@mui/material';
import { SyntheticEvent, useMemo, useState } from 'react';

interface NumericRangeFilterProps<K extends keyof FilteringTypes> {
    category: K;
    values: number[];
}

export const NumericRangeFilter = <K extends keyof FilteringTypes>({
    category,
    values,
}: NumericRangeFilterProps<K>) => {
    const { categoryValue, setValue } = useCategoryFilter(category);

    const min = useMemo(() => (values.length ? Math.min(...values) : 0), [values]);
    const max = useMemo(() => (values.length ? Math.max(...values) : 100), [values]);

    const activeFilterRange = categoryValue as number[] | undefined;
    const activeMin = activeFilterRange?.[0];
    const activeMax = activeFilterRange?.[1];

    const [prevSync, setPrevSync] = useState({ activeMin, activeMax, min, max });
    const [range, setRange] = useState<number[]>(() => {
        if (typeof activeMin === 'number' && typeof activeMax === 'number')
            return [activeMin, activeMax];
        return [min, max];
    });

    if (
        prevSync.activeMin !== activeMin ||
        prevSync.activeMax !== activeMax ||
        prevSync.min !== min ||
        prevSync.max !== max
    ) {
        setPrevSync({ activeMin, activeMax, min, max });
        setRange(
            typeof activeMin === 'number' && typeof activeMax === 'number'
                ? [activeMin, activeMax]
                : [min, max],
        );
    }

    const isPrice = category === 'PRICES';

    const formatValue = (val: number) => (isPrice ? `£${val.toFixed(2)}` : val.toLocaleString());

    const handleSliderChange = (_: Event | SyntheticEvent, newValue: number | number[]) => {
        if (Array.isArray(newValue)) setRange(newValue);
    };

    const handleSliderCommitted = (_: Event | SyntheticEvent, newValue: number | number[]) => {
        if (Array.isArray(newValue)) setValue(newValue as FilteringTypes[K]);
    };

    return (
        <Box sx={{ px: 1, pt: 1, pb: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 'bold' }}
                >
                    {formatValue(range[0]!)}
                </Typography>

                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 'bold' }}
                >
                    {formatValue(range[1]!)}
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
