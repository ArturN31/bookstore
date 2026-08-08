import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface ReviewFormActionBtnsProps {
    handleClose: () => void;
    handleReset: () => void;
    isSubmitting: boolean;
    isResetting: boolean;
}

export const ReviewFormActionBtns = ({
    handleClose,
    handleReset,
    isSubmitting,
    isResetting,
}: ReviewFormActionBtnsProps) => {
    return (
        <DialogActions className="flex items-center justify-between! border-t! border-[#E8E2D5]! bg-[#FAF7F2]! px-6! py-4!">
            <Button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                startIcon={<RestartAltIcon className="text-base" />}
                className="rounded-xl! px-3.5! py-2! text-sm! font-medium! text-[#78716C]! normal-case! transition-all hover:bg-[#E8E2D5]/50! hover:text-[#292524]! disabled:opacity-50"
            >
                {isResetting ? (
                    <div className="flex items-center gap-2">
                        <CircularProgress
                            size={18}
                            className="text-[#FAF7F2]!"
                        />
                        <span>Resetting...</span>
                    </div>
                ) : (
                    'Reset'
                )}
            </Button>

            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="rounded-xl! border! border-[#E8E2D5]! bg-white/60! px-5! py-2! text-sm! font-medium! text-[#78716C]! normal-case! transition-all hover:border-[#78716C]! hover:bg-[#E8E2D5]/40! hover:text-[#292524]! disabled:opacity-50"
                >
                    Cancel
                </Button>

                <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                    className="rounded-xl! bg-[#292524]! px-6! py-2! text-sm! font-semibold! text-[#FAF7F2]! normal-case! shadow-sm! transition-all duration-200 hover:bg-[#F59E0B]! hover:text-[#292524]! hover:shadow-md! disabled:bg-[#A8A29E]!"
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <CircularProgress
                                size={18}
                                className="text-[#FAF7F2]!"
                            />
                            <span>Submitting...</span>
                        </div>
                    ) : (
                        'Submit Review'
                    )}
                </Button>
            </div>
        </DialogActions>
    );
};
