'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

interface DeleteReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export const DeleteReviewModal = ({ isOpen, onClose, onConfirm }: DeleteReviewModalProps) => {
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleClose = () => {
        if (isDeleting) return;
        setConfirmText('');
        onClose();
    };

    const handleConfirm = async () => {
        if (confirmText !== 'DELETE') return;
        try {
            setIsDeleting(true);
            await onConfirm();
            handleClose();
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            fullWidth
            maxWidth="xs"
            aria-labelledby="delete-review-dialog-title"
            slotProps={{
                paper: {
                    className:
                        'bg-[#FAF7F2]! border! border-[#E8E2D5]! rounded-2xl! overflow-hidden! shadow-2xl!',
                },
            }}
        >
            <DialogTitle
                id="delete-review-dialog-title"
                className="bg-gunmetal! m-0! flex items-center gap-2.5 p-4! pr-12! font-semibold! text-[#FAF7F2]!"
            >
                <WarningAmberOutlinedIcon className="text-[#F59E0B]!" />
                <span className="text-lg tracking-wide">Delete Review</span>
            </DialogTitle>

            <div className="absolute top-2.5 right-2.5 z-10">
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    disabled={isDeleting}
                    className="text-[#FAF7F2]/80! hover:bg-white/10! hover:text-[#FAF7F2]!"
                >
                    <CloseIcon />
                </IconButton>
            </div>

            <DialogContent className="border-b! border-b-[#E8E2D5]! p-6!">
                <Stack spacing={3}>
                    <Typography
                        variant="body2"
                        className="text-[#78716C]"
                    >
                        This action cannot be undone. To confirm, please type{' '}
                        <strong className="font-bold text-red-600">DELETE</strong> below:
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Type DELETE"
                        value={confirmText}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setConfirmText(e.target.value)
                        }
                        disabled={isDeleting}
                        autoFocus
                        className="rounded-xl bg-white"
                    />
                </Stack>
            </DialogContent>

            <DialogActions className="flex items-center justify-between! border-t! border-[#E8E2D5]! bg-[#FAF7F2]! px-6! py-4!">
                <Button
                    type="button"
                    onClick={handleClose}
                    disabled={isDeleting}
                    className="rounded-xl! border! border-[#E8E2D5]! bg-white/60! px-5! py-2! text-sm! font-medium! text-[#78716C]! normal-case! transition-all hover:border-[#78716C]! hover:bg-[#E8E2D5]/40! hover:text-[#292524]! disabled:opacity-50"
                >
                    Cancel
                </Button>

                <Button
                    type="button"
                    onClick={handleConfirm}
                    variant="contained"
                    disabled={confirmText !== 'DELETE' || isDeleting}
                    className="rounded-xl! bg-[#292524]! px-6! py-2! text-sm! font-semibold! text-[#FAF7F2]! normal-case! shadow-sm! transition-all duration-200 hover:bg-red-600! hover:text-white! hover:shadow-md! disabled:bg-[#A8A29E]!"
                >
                    {isDeleting ? (
                        <div className="flex items-center gap-2">
                            <CircularProgress
                                size={18}
                                className="text-[#FAF7F2]!"
                            />
                            <span>Deleting...</span>
                        </div>
                    ) : (
                        'Delete Review'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
