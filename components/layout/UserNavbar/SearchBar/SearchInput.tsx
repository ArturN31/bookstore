import SearchIcon from '@mui/icons-material/Search';

export const SearchInput = ({
    input,
    handleInput,
}: {
    input: string;
    handleInput: (e: any) => void;
}) => {
    return (
        <div className="relative flex items-center">
            <input
                data-testid="searchbar-searchinput"
                aria-label="Search books"
                className="focus:outline-yellow h-12 w-75 rounded-md bg-white px-3 py-2 pr-14 text-slate-900 placeholder:text-slate-600"
                type="search"
                placeholder="Search B4U"
                value={input}
                onChange={(e) => handleInput(e)}
            />
            <div className="pointer-events-none absolute right-0 grid h-full w-12 place-items-center rounded-r-md border-l border-gray-300">
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-500"
                >
                    <circle
                        cx="10"
                        cy="10"
                        r="6"
                    />
                    <line
                        x1="21"
                        y1="21"
                        x2="17"
                        y2="17"
                    />
                </svg>
            </div>
        </div>
    );
};
