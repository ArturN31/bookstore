import { Button, DialogActions } from '@mui/material';

export const ModalActionBtns = ({ handleClose }: { handleClose: () => void }) => {
    return (
        <DialogActions className="justify-end! gap-2 bg-[#FAF7F2]! p-4!">
            <Button
                onClick={handleClose}
                className="rounded-xl! px-5! py-2! font-medium! text-[#78716C]! normal-case! hover:bg-[#E8E2D5]/50!"
            >
                Cancel
            </Button>
            <Button
                variant="contained"
                onClick={handleClose}
                className="bg-gunmetal! rounded-xl! px-6! py-2! font-semibold! text-[#FAF7F2]! normal-case! shadow-md! transition-all duration-200 hover:bg-[#44403C]!"
            >
                Submit Review
            </Button>
        </DialogActions>
    );
};
