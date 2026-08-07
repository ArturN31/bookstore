import { Button } from '@mui/material';
import RateReviewIcon from '@mui/icons-material/RateReview';

export const OpenModalBtn = ({ handleOpen }: { handleOpen: () => void }) => {
    return (
        <Button
            variant="contained"
            size="medium"
            startIcon={<RateReviewIcon className="text-[#F59E0B]!" />}
            onClick={handleOpen}
            className="bg-gunmetal! rounded-[20px]! px-6! py-[9.6px]! font-semibold! tracking-[0.3px]! text-[#FAF7F2]! normal-case! shadow-[0_4px_12px_rgba(41,37,36,0.15)]! transition-all duration-200 ease-in-out hover:-translate-y-px hover:bg-[#44403C]! hover:shadow-[0_6px_16px_rgba(41,37,36,0.25)]!"
        >
            Write a Review
        </Button>
    );
};
