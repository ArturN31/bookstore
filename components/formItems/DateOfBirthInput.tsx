export const DateOfBirthInput = ({
    dob,
    onChange,
}: {
    dob: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
    return (
        <div className="relative grid w-full max-w-md place-self-center">
            <label
                htmlFor="dob"
                className="inline-block rounded-sm px-1 text-sm font-medium text-gray-700 transition-colors duration-200 focus-within:bg-blue-100 focus-within:text-blue-700"
            >
                Date of Birth
            </label>

            <input
                autoComplete="off"
                required
                type="date"
                id="dob"
                name="dob"
                value={dob}
                onChange={onChange}
                className="block w-full rounded-md border border-gray-300 py-2 pl-1 text-sm text-gray-500 focus:border-blue-500 focus:outline-none"
                style={{ textAlign: 'left' }}
            />
        </div>
    );
};
