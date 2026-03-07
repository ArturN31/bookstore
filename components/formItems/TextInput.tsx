export const TextInput = ({
    id,
    label,
    value,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
    return (
        <div className="relative grid w-full max-w-md place-self-center">
            <label
                htmlFor={id}
                className="inline-block rounded-sm px-1 text-sm font-medium text-gray-700 transition-colors duration-200 focus-within:bg-blue-100 focus-within:text-blue-700"
            >
                {label}
            </label>
            <input
                autoComplete="off"
                required
                type="text"
                id={id}
                data-testid={`${id}-field`}
                name={id}
                placeholder={label}
                value={value}
                onChange={onChange}
                className={`block w-full rounded-md border border-gray-300 py-2 pl-1 text-sm focus:border-blue-500 focus:outline-none ${
                    id === 'postcode' ? 'uppercase placeholder:normal-case' : ''
                }`}
            />
        </div>
    );
};
