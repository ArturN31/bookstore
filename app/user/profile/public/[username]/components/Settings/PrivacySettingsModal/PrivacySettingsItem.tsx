import React from 'react';
import { PrivacySettingsToggleSwitch } from './PrivacySettingsToggleSwitch';

export interface PrivacySettingsItemProps {
    title: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onToggle: () => void;
}

export const PrivacySettingsItem: React.FC<PrivacySettingsItemProps> = ({
    title,
    description,
    checked,
    disabled = false,
    onToggle,
}) => {
    return (
        <div className="flex items-start justify-between gap-4">
            <div>
                <h3 className="font-semibold text-slate-100">{title}</h3>
                <p className="mt-0.5 text-sm text-slate-400">{description}</p>
            </div>
            <PrivacySettingsToggleSwitch
                checked={checked}
                disabled={disabled}
                onChange={onToggle}
                ariaLabel={title}
            />
        </div>
    );
};
