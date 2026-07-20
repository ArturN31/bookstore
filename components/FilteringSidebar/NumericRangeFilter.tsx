import { FilteringTypes } from '@/data/advancedFiltering/FilteringConstants';
import { Box, Slider, Typography } from '@mui/material';
import { SyntheticEvent, useMemo, useState } from 'react';

interface NumericRangeFilterProps {
    category: keyof FilteringTypes;
    values: number[];
}

export const NumericRangeFilter = ({ category, values }: NumericRangeFilterProps) => {
    const min = useMemo(() => (values.length ? Math.min(...values) : 0), [values]);
    const max = useMemo(() => (values.length ? Math.max(...values) : 100), [values]);

    const [range, setRange] = useState<number[]>([min, max]);

    const isPrice = category === 'PRICES';

    const handleSliderChange = (_: Event | SyntheticEvent, newValue: number | number[]) => {
        setRange(newValue as number[]);
    };

    const formatValue = (val: number) => (isPrice ? `$${val.toFixed(2)}` : val.toLocaleString());

    return (
        <Box sx={{ px: 1, pt: 1, pb: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 'bold' }}
                >
                    {formatValue(range[0])}
                </Typography>

                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 'bold' }}
                >
                    {formatValue(range[1])}
                </Typography>
            </Box>

            <Slider
                value={range}
                onChange={handleSliderChange}
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
