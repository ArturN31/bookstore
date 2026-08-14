'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { z } from 'zod';
import { useUserState } from '@/providers/user/utils/useUser';
import { NotLoggedInReviewFormInstruction } from './NotLoggedInReviewFormInstruction';
import { ProfileNotCompletedReviewFormInstruction } from './ProfileNotCompletedReviewFormInstruction';
import { ReviewForm } from './ReviewForm';
import { Button, DialogTitle, IconButton } from '@mui/material';
import RateReviewIcon from '@mui/icons-material/RateReview';
import CloseIconComponent from '@mui/icons-material/Close';

export interface ReviewFormFields {
    rating: number | null;
    review: string;
    message: string | null;
    validationErrors: z.core.$ZodIssue[];
}

interface ReviewFormModalProps {
    bookId: string;
    slug?: string;
    reviewId?: string | number;
    initialRating?: number | null;
    initialReviewText?: string;
    isOpen?: boolean;
    onClose?: () => void;
}

export function ReviewFormModal({
    bookId,
    slug,
    reviewId,
    initialRating = 0,
    initialReviewText = '',
    isOpen: controlledOpen,
    onClose: controlledOnClose,
}: ReviewFormModalProps) {
    const { loggedIn, profileExists } = useUserState();

    const isEditing = Boolean(reviewId);
    const [internalOpen, setInternalOpen] = useState<boolean>(false);
    const [formKey, setFormKey] = useState<number>(0);

    const isControlled = controlledOpen !== undefined && controlledOnClose !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    const handleOpen = () => {
        setFormKey((prev) => prev + 1);
        if (!isControlled) {
            setInternalOpen(true);
        }
    };

    const handleClose = () => {
        if (isControlled && controlledOnClose) {
            controlledOnClose();
        } else {
            setInternalOpen(false);
        }
    };

    const effectiveOpen = open;
    const [prevOpen, setPrevOpen] = useState<boolean>(effectiveOpen);
    if (effectiveOpen !== prevOpen) {
        setPrevOpen(effectiveOpen);
        if (effectiveOpen) {
            setFormKey((prev) => prev + 1);
        }
    }

    if (!loggedIn) return <NotLoggedInReviewFormInstruction />;
    if (!profileExists) return <ProfileNotCompletedReviewFormInstruction />;

    return (
        <>
            {!isControlled && !isEditing && (
                <Button
                    variant="contained"
                    size="medium"
                    startIcon={<RateReviewIcon className="text-[#F59E0B]!" />}
                    onClick={handleOpen}
                    className="bg-gunmetal! rounded-[20px]! px-6! py-[9.6px]! font-semibold! tracking-[0.3px]! text-[#FAF7F2]! normal-case! shadow-[0_4px_12px_rgba(41,37,36,0.15)]! transition-all duration-200 ease-in-out hover:-translate-y-px hover:bg-[#44403C]! hover:shadow-[0_6px_16px_rgba(41,37,36,0.25)]!"
                >
                    Write a Review
                </Button>
            )}

            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="sm"
                aria-labelledby="review-form-dialog-title"
                slotProps={{
                    paper: {
                        className:
                            'bg-[#FAF7F2]! border! border-[#E8E2D5]! rounded-2xl! overflow-hidden! shadow-2xl!',
                    },
                }}
            >
                <DialogTitle
                    id="review-form-dialog-title"
                    className="bg-gunmetal! m-0! flex items-center gap-2.5 p-4! pr-12! font-semibold! text-[#FAF7F2]!"
                >
                    <RateReviewIcon className="text-[#F59E0B]!" />
                    <span className="text-lg tracking-wide">
                        {isEditing ? 'Edit Review' : 'Create Review'}
                    </span>
                </DialogTitle>

                <div className="absolute top-2.5 right-2.5 z-10">
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        className="text-[#FAF7F2]/80! hover:bg-white/10! hover:text-[#FAF7F2]!"
                    >
                        <CloseIconComponent />
                    </IconButton>
                </div>

                <ReviewForm
                    key={`review-form-${formKey}`}
                    bookId={bookId}
                    slug={slug}
                    reviewId={reviewId}
                    initialRating={initialRating}
                    initialReviewText={initialReviewText}
                    handleClose={handleClose}
                    isEditing={isEditing}
                />
            </Dialog>
        </>
    );
}
