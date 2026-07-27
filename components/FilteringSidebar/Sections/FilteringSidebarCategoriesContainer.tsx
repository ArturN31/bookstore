import {
    CATEGORY_LABELS,
    FilteringTypes,
    NUMERIC_CATEGORIES,
} from '@/data/advancedFiltering/FilteringConstants';
import { useBookFilter } from '@/providers/advancedFiltering/BookAdvancedFilteringProvider';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import { SyntheticEvent, useMemo, useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DateRangeFilter } from '../Categories/DateRangeFilter';
import { NumericRangeFilter } from '../Categories/NumericRangeFilter';
import { CategoricalFilter } from '../Categories/CategoricalFilter';

export const FilteringSidebarCategoriesContainer = () => {
    const { advancedFilters } = useBookFilter();

    const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({
        AUTHORS: true,
        GENRES: true,
        PRICES: true,
        PUBLICATIONS: true,
    });

    const filterEntries = useMemo(() => {
        return Object.entries(advancedFilters) as [
            keyof FilteringTypes,
            FilteringTypes[keyof FilteringTypes],
        ][];
    }, [advancedFilters]);

    const handleAccordionToggle =
        (category: string) => (_: SyntheticEvent, isExpanded: boolean) => {
            setExpandedPanels((prev) => ({
                ...prev,
                [category]: isExpanded,
            }));
        };

    return (
        <div className="flex-1 overflow-y-auto p-4 pt-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-gray-300">
            {filterEntries.map(([category, values]) => {
                if (!values || (Array.isArray(values) && values.length === 0)) return null;

                const isNumeric = (NUMERIC_CATEGORIES as readonly string[]).includes(
                    category as string,
                );
                const isPublicationDate = category === 'PUBLICATIONS';
                const label = CATEGORY_LABELS[category] || category;
                const isExpanded = expandedPanels[category] ?? true;

                return (
                    <Accordion
                        key={category}
                        disableGutters
                        elevation={0}
                        expanded={isExpanded}
                        onChange={handleAccordionToggle(category)}
                        className="border-b border-gray-200 before:hidden last:border-b-0"
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon className="text-[1.2rem]" />}
                            className="min-h-11 px-1 [&_.MuiAccordionSummary-content]:my-2"
                        >
                            <Typography
                                variant="subtitle2"
                                className="text-sm font-bold tracking-[0.02em] text-gray-900"
                            >
                                {label}
                            </Typography>
                        </AccordionSummary>

                        <AccordionDetails className="px-1 pt-0 pb-4">
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
        </div>
    );
};
