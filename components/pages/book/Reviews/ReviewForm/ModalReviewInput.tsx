import { TextField } from '@mui/material';

export const ModalReviewInput = ({
    comment,
    setComment,
}: {
    comment: string;
    setComment: React.Dispatch<React.SetStateAction<string>>;
}) => {
    return (
        <TextField
            label="Review Details"
            placeholder="Describe your experience..."
            value={comment}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComment(e.target.value)}
            multiline
            rows={4}
            fullWidth
            slotProps={{
                input: {
                    className: 'bg-white/80! rounded-xl! text-[#292524]! font-serif',
                },
            }}
            sx={{
                '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                        borderColor: '#E8E2D5',
                    },
                    '&:hover fieldset': {
                        borderColor: '#292524',
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: '#F59E0B',
                    },
                },
                '& .MuiInputLabel-root': {
                    color: '#78716C',
                    '&.Mui-focused': {
                        color: '#292524',
                    },
                },
            }}
        />
    );
};
