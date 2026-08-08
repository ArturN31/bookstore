import React from 'react';
import { TextField } from '@mui/material';

interface ReviewFormCommentInputProps {
    comment: string;
    setComment: React.Dispatch<React.SetStateAction<string>>;
}

export const ReviewFormCommentInput = ({ comment, setComment }: ReviewFormCommentInputProps) => {
    return (
        <TextField
            label="Review Details"
            placeholder="Describe your experience..."
            value={comment}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setComment(e.target.value)
            }
            multiline
            rows={4}
            fullWidth
            slotProps={{
                input: {
                    className:
                        'bg-white/80! rounded-xl! text-[#292524]! font-serif [&_fieldset]:border-[#E8E2D5]! hover:[&_fieldset]:border-[#292524]! focus-within:[&_fieldset]:border-[#F59E0B]!',
                },
                inputLabel: {
                    className: 'text-[#78716C]! [&.Mui-focused]:text-[#292524]!',
                },
            }}
        />
    );
};
