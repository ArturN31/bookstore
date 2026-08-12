import { Box, Link, Typography } from '@mui/material';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';

export const ProfileNotCompletedReviewFormInstruction = () => {
    return (
        <Box className="flex items-center gap-3 rounded-xl border border-[#E8E2D5] bg-[#F3EDE2] p-4 text-[#78716C]">
            <AccountCircleOutlinedIcon className="text-[#F59E0B]!" />
            <Typography
                variant="body2"
                className="text-[#292524]!"
            >
                Please{' '}
                <Link
                    href="/user/profile"
                    className="font-semibold text-[#292524] underline hover:text-[#F59E0B]"
                >
                    complete your profile
                </Link>{' '}
                to leave a review.
            </Typography>
        </Box>
    );
};
