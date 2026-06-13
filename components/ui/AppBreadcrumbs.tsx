'use client';

import { Breadcrumbs, Link as MuiLink, Typography, Box } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import NextLink from 'next/link';

export interface BreadcrumbItem {
    label: string;
    href: string;
    active?: boolean;
    count?: number;
}

export const AppBreadcrumbs = ({ items }: { items: BreadcrumbItem[] }) => {
    return (
        <Breadcrumbs
            separator={<KeyboardArrowRightIcon fontSize="small" />}
            aria-label="breadcrumb"
            sx={{ mb: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}
        >
            {items.map((item) =>
                item.active ? (
                    <Box
                        key={item.label}
                        component="span"
                        sx={{ display: 'flex', alignItems: 'center' }}
                    >
                        <Typography
                            sx={{
                                color: 'text.primary',
                                fontWeight: 'bold',
                                fontStyle: 'italic',
                                textTransform: 'lowercase',
                                '&::first-letter': { textTransform: 'uppercase' },
                            }}
                        >
                            {item.label}
                        </Typography>
                        {item.count !== undefined && (
                            <Typography
                                component="span"
                                sx={{
                                    ml: 1,
                                    fontSize: '0.875rem',
                                    fontWeight: 'light',
                                    color: 'text.secondary',
                                    textTransform: 'none',
                                }}
                            >
                                ({item.count})
                            </Typography>
                        )}
                    </Box>
                ) : (
                    <MuiLink
                        key={item.label}
                        component={NextLink}
                        underline="hover"
                        color="inherit"
                        href={item.href}
                        sx={{ fontSize: '0.875rem' }}
                    >
                        {item.label}
                    </MuiLink>
                ),
            )}
        </Breadcrumbs>
    );
};
