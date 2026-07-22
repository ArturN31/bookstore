import { CATEGORY_LABELS, FilteringTypes } from '@/data/advancedFiltering/FilteringConstants';
import {
    Box,
    Checkbox,
    FormControlLabel,
    FormGroup,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material';
import { ChangeEvent, useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { useBookFilter } from '@/providers/advancedFiltering/BookAdvancedFilteringProvider';

interface CategoricalFilterProps {
    category: keyof FilteringTypes;
    values: (string | number)[];
}

export const CategoricalFilter = ({ category, values }: CategoricalFilterProps) => {
    const { chosenFilters, setChosenFilters } = useBookFilter();

    const [searchQuery, setSearchQuery] = useState('');

    const formattedValues = useMemo(() => {
        return values.map((v) => String(v)).sort((a, b) => a.localeCompare(b));
    }, [values]);

    const filteredValues = useMemo(() => {
        if (!searchQuery.trim()) return formattedValues;
        return formattedValues.filter((val) =>
            val.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [formattedValues, searchQuery]);

    const showSearch = formattedValues.length > 6;

    const handleChoice = (e: ChangeEvent<HTMLInputElement>) => {
        const { checked, value } = e.target;

        setChosenFilters((prev) => {
            const currentValues = (prev[category] as (string | number)[]) || [];
            const stringifiedValues = currentValues.map(String);

            let updatedValues: (string | number)[];

            if (checked) {
                updatedValues = stringifiedValues.includes(value)
                    ? currentValues
                    : [...currentValues, value];
            } else {
                updatedValues = currentValues.filter((val) => String(val) !== value);
            }

            return {
                ...prev,
                [category]: updatedValues,
            };
        });
    };

    const activeSelectedValues = useMemo(() => {
        const categoryState = chosenFilters[category];
        if (Array.isArray(categoryState)) {
            return categoryState.map(String);
        }
        return [];
    }, [chosenFilters, category]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {showSearch && (
                <TextField
                    placeholder={`Search ${CATEGORY_LABELS[category]}...`}
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon
                                        sx={{ fontSize: '1rem', color: 'text.secondary' }}
                                    />
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={{
                        mb: 0.5,
                        '& .MuiInputBase-input': {
                            fontSize: '0.8125rem',
                            py: 0.75,
                        },
                    }}
                />
            )}

            <FormGroup
                sx={{
                    maxHeight: 200,
                    overflowY: 'auto',
                    flexWrap: 'nowrap',
                    gap: 0.25,
                    pr: 0.5,
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'divider',
                        borderRadius: 2,
                    },
                }}
            >
                {filteredValues.length === 0 ? (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ py: 1, px: 0.5 }}
                    >
                        No matching options
                    </Typography>
                ) : (
                    filteredValues.map((valueStr) => {
                        const isChecked = activeSelectedValues.includes(valueStr);

                        return (
                            <FormControlLabel
                                key={`${category}-${valueStr}`}
                                control={
                                    <Checkbox
                                        size="small"
                                        name={category}
                                        value={valueStr}
                                        checked={isChecked}
                                        onChange={handleChoice}
                                        sx={{
                                            p: 0.5,
                                            color: 'text.secondary',
                                            '&.Mui-checked': {
                                                color: 'primary.main',
                                            },
                                        }}
                                    />
                                }
                                label={
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: 'text.primary',
                                            fontSize: '0.8125rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {valueStr}
                                    </Typography>
                                }
                                sx={{
                                    mx: 0,
                                    py: 0.25,
                                    px: 0.5,
                                    borderRadius: 1,
                                    width: '100%',
                                    '&:hover': {
                                        backgroundColor: 'action.hover',
                                    },
                                }}
                            />
                        );
                    })
                )}
            </FormGroup>
        </Box>
    );
};
