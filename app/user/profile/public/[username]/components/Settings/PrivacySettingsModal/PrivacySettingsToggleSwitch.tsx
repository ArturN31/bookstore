import React from 'react';

export interface PrivacySettingsToggleSwitchProps {
    checked: boolean;
    disabled?: boolean;
    onChange: () => void;
    ariaLabel?: string;
}

export const PrivacySettingsToggleSwitch: React.FC<PrivacySettingsToggleSwitchProps> = ({
    checked,
    disabled = false,
    onChange,
    ariaLabel,
}) => {
    return (
        <button
            type="button"
            role="switch"
            aria-label={ariaLabel}
            aria-checked={checked}
            disabled={disabled}
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                checked ? 'bg-amber-500' : 'bg-slate-700'
            }`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    checked ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
};
