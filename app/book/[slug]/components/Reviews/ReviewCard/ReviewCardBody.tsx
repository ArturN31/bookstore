// ReviewCardBody.tsx
'use client';

import { Box, CardContent, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

interface ReviewCardBodyProps {
    id: string | number;
    username: string;
    review: string;
    createdAt: Date | string;
    updatedAt?: Date | string | null;
    isUpdated?: boolean;
    onEdit?: (id: string | number) => void;
    onDelete?: (id: string | number) => void;
}

const formatDate = (dateVal: Date | string): string => {
    const parsedDate = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString()
        : '';
};

export const ReviewCardBody = ({
    id,
    username,
    review,
    createdAt,
    updatedAt,
    isUpdated,
    onEdit,
    onDelete,
}: ReviewCardBodyProps) => {
    const formattedCreatedDate = formatDate(createdAt);
    const formattedUpdatedDate = updatedAt ? formatDate(updatedAt) : '';

    const showEditedLabel = Boolean(
        isUpdated || (formattedUpdatedDate && formattedUpdatedDate !== formattedCreatedDate),
    );

    return (
        <CardContent className="grow p-6! last:pb-6!">
            <Stack spacing={2.5}>
                {/* Header: User Metadata + Actions */}
                <Box className="flex items-start justify-between gap-4">
                    {/* Author & Timestamp Stack */}
                    <Box className="flex flex-col gap-0.5">
                        <Typography
                            variant="subtitle2"
                            className="text-sm! font-bold! tracking-[0.3px]! text-[#1C1917]!"
                        >
                            — {username}
                        </Typography>
                        <Typography
                            variant="caption"
                            className="font-serif! text-xs! text-[#78716C]! italic!"
                        >
                            Posted {formattedCreatedDate}
                            {showEditedLabel && formattedUpdatedDate && (
                                <span className="ml-1 text-[#A8A29E]!">
                                    • Edited {formattedUpdatedDate}
                                </span>
                            )}
                        </Typography>
                    </Box>

                    {/* Action Buttons */}
                    {(onEdit || onDelete) && (
                        <Box className="-mt-1 -mr-1.5 flex shrink-0 items-center gap-1">
                            {onEdit && (
                                <Tooltip title="Edit Review">
                                    <IconButton
                                        size="small"
                                        onClick={() => onEdit(id)}
                                        className="text-gray-400 transition-colors hover:text-blue-600"
                                    >
                                        <EditOutlinedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {onDelete && (
                                <Tooltip title="Delete Review">
                                    <IconButton
                                        size="small"
                                        onClick={() => onDelete(id)}
                                        className="text-gray-400 transition-colors hover:text-red-600"
                                    >
                                        <DeleteOutlineOutlinedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    )}
                </Box>

                {/* Review Text Body */}
                <Box className="relative">
                    <FormatQuoteIcon className="absolute -top-3 -left-2.5 -scale-x-100 text-[36px]! text-[#E8E2D5]!" />
                    <Typography
                        variant="body2"
                        className="pl-5! font-serif! text-[0.975rem]! leading-[1.75]! wrap-break-word! whitespace-pre-wrap! text-[#292524]!"
                    >
                        {review}
                    </Typography>
                </Box>
            </Stack>
        </CardContent>
    );
};
