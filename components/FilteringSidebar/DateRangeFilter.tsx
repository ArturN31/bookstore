import { Box, TextField } from '@mui/material';
import { useMemo, useState } from 'react';

interface DateRangeFilterProps {
    values: string[];
}

export const DateRangeFilter = ({ values }: DateRangeFilterProps) => {
    const sortedDates = useMemo(() => {
        return values
            .map((v) => String(v).slice(0, 10))
            .filter((v) => !isNaN(Date.parse(v)))
            .sort();
    }, [values]);

    const minDate = sortedDates[0] || '';
    const maxDate = sortedDates[sortedDates.length - 1] || '';

    const [startDate, setStartDate] = useState(minDate);
    const [endDate, setEndDate] = useState(maxDate);

    return (
        <Box sx={{ display: 'flex', gap: 1, pt: 1, px: 0.5 }}>
            <TextField
                label="From"
                type="date"
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
                onChange={(e) => setEndDate(e.target.value)}
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
