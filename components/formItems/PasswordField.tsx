import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useState, ChangeEvent, MouseEvent } from 'react';
import KeyIcon from '@mui/icons-material/Key';

interface PasswordFieldProps {
    id: string;
    label: string;
    placeholder: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const PasswordField = ({ id, label, placeholder, value, onChange }: PasswordFieldProps) => {
    const [visible, setVisible] = useState(false);

    const handleVisibility = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setVisible(!visible);
    };

    return (
        <div className="grid">
            <label
                htmlFor={id}
                className="inline-block rounded-sm px-1 text-sm font-medium text-gray-700 transition-colors duration-200 focus-within:bg-blue-100 focus-within:text-blue-700"
            >
                {label}
            </label>
            <div className="relative flex items-center">
                <div className="pointer-events-none absolute top-2 flex items-center pl-3 text-gray-400">
                    <KeyIcon aria-hidden="true" />
                </div>
                <input
                    required
                    type={visible ? 'text' : 'password'}
                    id={id}
                    name={id}
                    data-testid={`${id}-field`}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className="block h-full w-full rounded-l-md border border-gray-300 py-2 pl-10 text-sm focus:border-blue-500 focus:outline-none"
                    aria-describedby={`${id}-helper`}
                />
                <button
                    type="button"
                    className="block w-fit rounded-r-md border border-l-0 border-gray-300 px-1 py-2 text-sm hover:cursor-pointer"
                    onClick={handleVisibility}
                >
                    {!visible ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
                </button>
            </div>
        </div>
    );
};
