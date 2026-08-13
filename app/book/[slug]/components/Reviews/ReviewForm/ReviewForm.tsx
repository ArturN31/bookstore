import { DialogContent, Stack } from '@mui/material';
import { FormErrors } from '@/components/formItems/FormErrors';
import { ReviewFormRatingInput } from './FormItems/ReviewFormRatingInput';
import { ReviewFormCommentInput } from './FormItems/ReviewFormCommentInput';
import { ReviewFormActionBtns } from './FormItems/ReviewFormActionBtns';
import { useActionState, useState, useTransition } from 'react';
import { ReviewFormFields } from './ReviewFormModal';
import { ReviewFormState } from '@/data/books/reviews/ReviewConstants';
import { UserReviewAction } from '@/data/books/reviews/ReviewAction';
import z from 'zod';
import { reviewSchema } from '@/data/schemas/reviewSchema';
import { useUserState } from '@/providers/user/utils/useUser';

interface ReviewFormProps {
    bookId: string;
    reviewId?: string | number;
    initialRating?: number | null;
    initialReviewText?: string;
    handleClose: () => void;
    isEditing?: boolean;
}

export const ReviewForm = ({
    bookId,
    reviewId,
    initialRating = 0,
    initialReviewText = '',
    handleClose,
    isEditing = false,
}: ReviewFormProps) => {
    const { user } = useUserState();

    const [formData, setFormData] = useState<ReviewFormFields>({
        rating: initialRating,
        review: initialReviewText,
        message: null,
        validationErrors: [],
    });

    const [formState, formAction] = useActionState(
        async (state: ReviewFormState, payload: FormData) => {
            const result = await UserReviewAction(state, payload);
            if (result) {
                setFormData((prev) => ({
                    ...prev,
                    message: result.message ?? null,
                    validationErrors: (result.validationErrors as z.core.$ZodIssue[]) ?? [],
                }));
            }
            return result;
        },
        { message: null, validationErrors: [] },
    );

    const [isTransitioningSubmit, startTransitionSubmit] = useTransition();
    const [isTransitioningReset, startTransitionReset] = useTransition();

    const handleFieldChangeByName = (name: 'rating' | 'review', value: number | null | string) => {
        setFormData((prev) => {
            const updatedData = { ...prev, [name]: value };
            const validation = reviewSchema.safeParse({
                rating: updatedData.rating ? updatedData.rating.toString() : '',
                review: updatedData.review,
            });

            if (validation.success) return { ...updatedData, validationErrors: [], message: null };

            const filteredIssues = validation.error.issues.filter((issue) => {
                const isCurrentField = issue.path.includes(name);
                const isNotRequiredError =
                    issue.code !== 'invalid_type' && issue.message.toLowerCase() !== 'required';

                return isCurrentField && isNotRequiredError;
            });

            return {
                ...updatedData,
                validationErrors: filteredIssues,
                message: filteredIssues.length > 0 ? 'Validation Issues' : null,
            };
        });
    };

    const handleRatingChange: React.Dispatch<React.SetStateAction<number | null>> = (value) => {
        const newRating = typeof value === 'function' ? value(formData.rating) : value;
        handleFieldChangeByName('rating', newRating);
    };

    const handleReviewChange: React.Dispatch<React.SetStateAction<string>> = (value) => {
        const newReview = typeof value === 'function' ? value(formData.review) : value;
        handleFieldChangeByName('review', newReview);
    };

    const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
        event.preventDefault();

        const result = reviewSchema.safeParse({
            rating: formData.rating ? formData.rating.toString() : '',
            review: formData.review,
        });

        if (!result.success) {
            setFormData((prev) => ({
                ...prev,
                validationErrors: result.error.issues,
                message: 'Please fix the errors before submitting.',
            }));
            return;
        }

        const submitData = new FormData();
        if (formData.rating !== null && formData.rating !== undefined)
            submitData.append('rating', formData.rating.toString());
        submitData.append('review', formData.review);
        submitData.append('bookId', bookId);
        submitData.append('username', user.username);

        if (isEditing && reviewId !== undefined) {
            submitData.append('reviewId', reviewId.toString());
        }

        startTransitionSubmit(async () => {
            await formAction(submitData);
            handleClose();
        });
    };

    const handleReset = () => {
        startTransitionReset(async () => {
            if (isEditing) {
                setFormData({
                    rating: initialRating,
                    review: initialReviewText,
                    message: null,
                    validationErrors: [],
                });
                return;
            }

            const resetData = new FormData();
            resetData.append('reset', 'yes');
            await formAction(resetData);

            setFormData({
                rating: 0,
                review: '',
                message: null,
                validationErrors: [],
            });
        });
    };

    return (
        <form
            id="review-form"
            onSubmit={handleSubmit}
        >
            <DialogContent className="border-b! border-b-[#E8E2D5]! p-6!">
                <Stack spacing={3}>
                    <FormErrors
                        formError={formData.message ?? undefined}
                        validationErrors={
                            formData.validationErrors?.length
                                ? formData.validationErrors
                                : undefined
                        }
                    />

                    <ReviewFormRatingInput
                        rating={formData.rating}
                        setRating={handleRatingChange}
                    />

                    <ReviewFormCommentInput
                        comment={formData.review}
                        setComment={handleReviewChange}
                    />
                </Stack>
            </DialogContent>

            <ReviewFormActionBtns
                handleClose={handleClose}
                handleReset={handleReset}
                isSubmitting={isTransitioningSubmit}
                isResetting={isTransitioningReset}
            />
        </form>
    );
};
