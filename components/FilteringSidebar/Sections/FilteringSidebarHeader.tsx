import { IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export const FilteringSidebarHeader = ({ handleClose }: { handleClose: () => void }) => {
    return (
        <div className="flex items-center justify-between p-4 pb-3">
            <Typography
                variant="h6"
                component="h2"
                className="font-bold"
            >
                Filters
            </Typography>

            <IconButton
                size="small"
                onClick={handleClose}
                aria-label="close filters sidebar"
                className="text-gray-900"
            >
                <CloseIcon />
            </IconButton>
        </div>
    );
};
