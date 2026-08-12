import { Box, Divider, Skeleton } from '@mui/material';

export const FilteringSidebarSkeleton = () => {
    return (
        <Box
            sx={{
                p: 2.5,
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                overflowY: 'auto',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    mb: 2,
                }}
            >
                <Skeleton
                    variant="text"
                    width={120}
                    height={32}
                />
                <Skeleton
                    variant="circular"
                    width={32}
                    height={32}
                />
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box
                sx={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                }}
            >
                <Skeleton
                    variant="text"
                    width={80}
                    height={20}
                />
                <Skeleton
                    variant="rectangular"
                    width={70}
                    height={28}
                    sx={{ borderRadius: 1 }}
                />
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            {Array.from({ length: 4 }).map((_, i) => (
                <Box
                    key={i}
                    sx={{ mb: 3 }}
                >
                    <Skeleton
                        variant="text"
                        width={100}
                        height={24}
                        sx={{ mb: 1.5 }}
                    />

                    {Array.from({ length: 3 }).map((_, j) => (
                        <Box
                            key={j}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                mb: 1,
                            }}
                        >
                            <Skeleton
                                variant="rectangular"
                                width={18}
                                height={18}
                                sx={{ borderRadius: 0.5 }}
                            />
                            <Skeleton
                                variant="text"
                                width={`${80 - j * 15}%`}
                                height={20}
                            />
                        </Box>
                    ))}
                </Box>
            ))}
        </Box>
    );
};
