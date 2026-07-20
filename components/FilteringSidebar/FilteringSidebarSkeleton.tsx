import { Box, Divider, Paper, Skeleton } from '@mui/material';

export const FilteringSidebarSkeleton = () => {
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
                p: 2.5,
                borderRight: 1,
                borderColor: 'divider',
                boxSizing: 'border-box',
                flexShrink: 0,
            }}
        >
            <Skeleton
                variant="text"
                width={100}
                height={32}
                sx={{ mb: 2 }}
            />
            <Divider sx={{ mb: 2 }} />
            {Array.from({ length: 4 }).map((_, i) => (
                <Box
                    key={i}
                    sx={{ mb: 3 }}
                >
                    <Skeleton
                        variant="text"
                        width={80}
                        height={20}
                        sx={{ mb: 1 }}
                    />
                    <Skeleton
                        variant="rectangular"
                        width="100%"
                        height={24}
                        sx={{ mb: 0.5, borderRadius: 0.5 }}
                    />
                    <Skeleton
                        variant="rectangular"
                        width="80%"
                        height={24}
                        sx={{ mb: 0.5, borderRadius: 0.5 }}
                    />
                    <Skeleton
                        variant="rectangular"
                        width="60%"
                        height={24}
                        sx={{ borderRadius: 0.5 }}
                    />
                </Box>
            ))}
        </Paper>
    );
};
