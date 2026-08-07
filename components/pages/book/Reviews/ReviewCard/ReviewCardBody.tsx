import { Box, CardContent, Stack, Typography } from '@mui/material';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

export const ReviewCardBody = ({
    username,
    review,
    createdAt,
    isUpdated,
}: {
    username: string;
    review: string;
    createdAt: Date;
    isUpdated: boolean;
}) => {
    return (
        <CardContent className="grow p-6! last:pb-6!">
            <Stack spacing={2}>
                <Box className="flex items-center justify-between">
                    <Typography
                        variant="subtitle2"
                        className="text-sm! font-bold! tracking-[0.3px]! text-[#1C1917]!"
                    >
                        — {username}
                    </Typography>
                    <Typography
                        variant="caption"
                        className="font-serif! text-[#78716C]! italic!"
                    >
                        {createdAt.toLocaleDateString()} {isUpdated && '(Edited)'}
                    </Typography>
                </Box>

                <Box className="relative">
                    <FormatQuoteIcon className="absolute -top-3 -left-2.5 -scale-x-100 text-[36px]! text-[#E8E2D5]!" />
                    <Typography
                        variant="body2"
                        className="pl-5! font-serif! text-[0.975rem]! leading-[1.75]! wrap-break-word! whitespace-pre-wrap! text-[#292524]!"
                    >
                        {review}
                    </Typography>
                </Box>
            </Stack>
        </CardContent>
    );
};
