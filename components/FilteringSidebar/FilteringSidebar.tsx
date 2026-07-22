'use client';

import { SyntheticEvent, useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import {
    CATEGORY_LABELS,
    DEFAULT_FILTERING_CONSTANTS,
    FilteringTypes,
    NUMERIC_CATEGORIES,
} from '@/data/advancedFiltering/FilteringConstants';
import { useBookFilter } from '@/providers/advancedFiltering/BookAdvancedFilteringProvider';
import { FilteringSidebarSkeleton } from './FilteringSidebarSkeleton';
import { DateRangeFilter } from './DateRangeFilter';
import { NumericRangeFilter } from './NumericRangeFilter';
import { CategoricalFilter } from './CategoricalFilter';

export const FilteringSidebar = () => {
    const { advancedFilters, isLoading, setChosenFilters, chosenFilters } = useBookFilter();

    const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({
        AUTHORS: true,
        GENRES: true,
        PRICES: true,
        PUBLICATIONS: true,
    });

    const handleAccordionToggle =
        (category: string) => (_: SyntheticEvent, isExpanded: boolean) => {
            setExpandedPanels((prev) => ({
                ...prev,
                [category]: isExpanded,
            }));
        };

    const filterEntries = Object.entries(advancedFilters) as [
        keyof FilteringTypes,
        FilteringTypes[keyof FilteringTypes],
    ][];

    const handleReset = () => {
        setChosenFilters(DEFAULT_FILTERING_CONSTANTS);
    };

    console.log(chosenFilters);

    if (isLoading) return <FilteringSidebarSkeleton />;

    return (
        <Paper
            elevation={0}
            square
            sx={{
                width: 280,
                height: '100vh',
                position: 'sticky',
                top: 0,
                overflowY: 'auto',
                p: 2,
                borderRight: 1,
                borderColor: 'divider',
                boxSizing: 'border-box',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'divider',
                    borderRadius: 3,
                },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 1.5,
                }}
            >
                <Typography
                    variant="h6"
                    component="h2"
                    sx={{ fontWeight: 'bold' }}
                >
                    Filters
                </Typography>

                <Button
                    size="small"
                    startIcon={<RestartAltIcon />}
                    onClick={handleReset}
                    sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        '&:hover': { color: 'error.main' },
                    }}
                >
                    Reset
                </Button>
            </Box>

            <Divider sx={{ mb: 1 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {filterEntries.map(([category, values]) => {
                    if (!values || values.length === 0) return null;

                    const isNumeric = NUMERIC_CATEGORIES.includes(category);
                    const isPublicationDate = category === 'PUBLICATIONS';
                    const label = CATEGORY_LABELS[category] || category;

                    return (
                        <Accordion
                            key={category}
                            disableGutters
                            elevation={0}
                            expanded={!!expandedPanels[category]}
                            onChange={handleAccordionToggle(category)}
                            sx={{
                                '&:before': { display: 'none' },
                                borderBottom: 1,
                                borderColor: 'divider',
                                '&:last-child': { borderBottom: 'none' },
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon sx={{ fontSize: '1.2rem' }} />}
                                sx={{
                                    px: 0.5,
                                    minHeight: 44,
                                    '& .MuiAccordionSummary-content': { my: 1 },
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: '0.8125rem',
                                        letterSpacing: '0.02em',
                                        color: 'text.primary',
                                    }}
                                >
                                    {label}
                                </Typography>
                            </AccordionSummary>

                            <AccordionDetails sx={{ px: 0.5, pt: 0, pb: 2 }}>
                                {isPublicationDate ? (
                                    <DateRangeFilter
                                        category={category}
                                        values={values as string[]}
                                    />
                                ) : isNumeric ? (
                                    <NumericRangeFilter
                                        category={category}
                                        values={values as number[]}
                                    />
                                ) : (
                                    <CategoricalFilter
                                        category={category}
                                        values={values as (string | number)[]}
                                    />
                                )}
                            </AccordionDetails>
                        </Accordion>
                    );
                })}
            </Box>
        </Paper>
    );
};
