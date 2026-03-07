export const FormBtns = ({
    isTransitioningSubmit,
    isTransitioningReset,
    handleReset,
}: {
    isTransitioningSubmit: boolean;
    isTransitioningReset: boolean;
    handleReset: () => void;
}) => {
    return (
        <div className="flex justify-end gap-3 pt-4">
            <button
                type="submit"
                className="bg-yellow hover:bg-yellow-[0.8] cursor-pointer rounded-md px-5 py-2 text-sm font-semibold text-black duration-200 focus:ring-2 focus:outline-none disabled:opacity-50"
                disabled={isTransitioningSubmit}
            >
                {isTransitioningSubmit ? 'Submitting...' : 'Submit'}
            </button>
            <button
                data-testid="reset-btn"
                type="reset"
                onClick={handleReset}
                className="focus-ring-gray-300 cursor-pointer rounded-md border border-gray-300 px-5 py-2 text-sm font-semibold text-black transition-colors duration-200 hover:bg-gray-100 focus:ring-2 focus:outline-none disabled:opacity-50"
                disabled={isTransitioningReset}
            >
                {isTransitioningReset ? 'Clearing...' : 'Clear'}
            </button>
        </div>
    );
};
