import { Box, Link, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export const NotLoggedInReviewFormInstruction = () => {
    return (
        <Box className="flex items-center gap-3 rounded-xl border border-[#E8E2D5] bg-[#F3EDE2] p-4 text-[#78716C]">
            <InfoOutlinedIcon className="text-[#F59E0B]!" />
            <Typography
                variant="body2"
                className="text-[#292524]!"
            >
                Please{' '}
                <Link
                    href="/user/auth/signin"
                    className="font-semibold text-[#292524] underline hover:text-[#F59E0B]"
                >
                    log in
                </Link>{' '}
                or{' '}
                <Link
                    href="/user/auth/signup"
                    className="font-semibold text-[#292524] underline hover:text-[#F59E0B]"
                >
                    create an account
                </Link>{' '}
                to leave a review.
            </Typography>
        </Box>
    );
};
