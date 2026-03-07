import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import { ChangeEvent } from 'react';

interface EmailFieldProps {
    email: string;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const EmailField = ({ email, onChange }: EmailFieldProps) => {
    return (
        <div className="relative grid w-full max-w-md place-self-center">
            <label
                htmlFor="email"
                className="inline-block rounded-sm px-1 text-sm font-medium text-gray-700 transition-colors duration-200 focus-within:bg-blue-100 focus-within:text-blue-700"
            >
                Email
            </label>

            <div className="relative">
                <div className="pointer-events-none absolute top-2 flex items-center pl-3 text-gray-400">
                    <AlternateEmailIcon aria-hidden="true" />
                </div>
                <input
                    type="email"
                    id="email"
                    name="email"
                    data-testid="email-field"
                    placeholder="Email"
                    value={email}
                    onChange={onChange}
                    className="block w-full rounded-md border border-gray-300 py-2 pl-10 text-sm focus:border-blue-500 focus:outline-none"
                />
            </div>
        </div>
    );
};
