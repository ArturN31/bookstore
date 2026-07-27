import { ChangeEvent, useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import {
    Box,
    Checkbox,
    FormControlLabel,
    FormGroup,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material';

import { CATEGORY_LABELS, FilteringTypes } from '@/data/advancedFiltering/FilteringConstants';
import { useCategoryFilter } from '@/data/advancedFiltering/useCategoryFilter';

interface CategoricalFilterProps<K extends keyof FilteringTypes> {
    category: K;
    values: (string | number)[];
}

export const CategoricalFilter = <K extends keyof FilteringTypes>({
    category,
    values,
}: CategoricalFilterProps<K>) => {
    const { categoryValue, toggleItem } = useCategoryFilter(category);

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
        toggleItem(e.target.value);
    };

    const activeSelectedValues = useMemo(() => {
        if (Array.isArray(categoryValue)) {
            return (categoryValue as (string | number)[]).map(String);
        }
        return [];
    }, [categoryValue]);

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
                                key={`${String(category)}-${valueStr}`}
                                control={
                                    <Checkbox
                                        size="small"
                                        name={String(category)}
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
