import FilterListIcon from '@mui/icons-material/FilterList';

export const FilteringSidebarButton = ({ handleOpen }: { handleOpen: () => void }) => {
    return (
        <button
            type="button"
            onClick={handleOpen}
            className={
                'flex cursor-pointer items-center gap-1.5 px-2 py-1.5 font-semibold text-[#364153] capitalize transition-colors duration-200 hover:bg-transparent hover:text-[#155dfc] hover:underline active:bg-transparent'
            }
        >
            <span className="flex items-center">
                <FilterListIcon />
            </span>
            <span>Filter Books</span>
        </button>
    );
};
