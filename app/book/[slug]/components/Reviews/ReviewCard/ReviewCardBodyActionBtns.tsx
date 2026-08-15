import { Box, IconButton, Tooltip } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

interface ReviewCardBodyActionBtnsProps {
    id: string | number;
    onEdit?: (id: string | number) => void;
    onDelete?: (id: string | number) => void;
}

export const ReviewCardBodyActionBtns = ({
    id,
    onEdit,
    onDelete,
}: ReviewCardBodyActionBtnsProps) => {
    return (
        (onEdit || onDelete) && (
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
        )
    );
};
