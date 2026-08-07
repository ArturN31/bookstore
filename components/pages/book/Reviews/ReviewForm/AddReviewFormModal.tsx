'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import CloseIcon from '@mui/icons-material/Close';
import RateReviewIcon from '@mui/icons-material/RateReview';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import Link from 'next/link';
import { OpenModalBtn } from './OpenModalBtn';
import { ModalActionBtns } from './ModalActionBtns';
import { ModalRatingInput } from './ModalRatingInput';
import { ModalReviewInput } from './ModalReviewInput';
import { useUserState } from '@/providers/user/utils/useUser';

export function AddReviewFormModal() {
    const { loggedIn, profileExists } = useUserState();

    const [open, setOpen] = useState<boolean>(false);
    const [rating, setRating] = useState<number | null>(0);
    const [comment, setComment] = useState<string>('');

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    if (!loggedIn) {
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
    }

    if (!profileExists) {
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
    }

    return (
        <React.Fragment>
            <OpenModalBtn handleOpen={handleOpen} />

            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="sm"
                aria-labelledby="add-review-dialog-title"
                slotProps={{
                    paper: {
                        className:
                            'bg-[#FAF7F2]! border! border-[#E8E2D5]! rounded-2xl! overflow-hidden! shadow-2xl!',
                    },
                }}
            >
                <DialogTitle
                    id="add-review-dialog-title"
                    className="bg-gunmetal! m-0! flex items-center gap-2.5 p-4! pr-12! font-semibold! text-[#FAF7F2]!"
                >
                    <RateReviewIcon className="text-[#F59E0B]!" />
                    <span className="text-lg tracking-wide">Create Review</span>
                </DialogTitle>

                <div className="absolute top-2.5 right-2.5 z-10">
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        className="text-[#FAF7F2]/80! hover:bg-white/10! hover:text-[#FAF7F2]!"
                    >
                        <CloseIcon />
                    </IconButton>
                </div>

                <DialogContent className="border-b! border-b-[#E8E2D5]! p-6!">
                    <Stack spacing={3}>
                        <ModalRatingInput
                            rating={rating}
                            setRating={setRating}
                        />

                        <ModalReviewInput
                            comment={comment}
                            setComment={setComment}
                        />
                    </Stack>
                </DialogContent>

                <ModalActionBtns handleClose={handleClose} />
            </Dialog>
        </React.Fragment>
    );
}
