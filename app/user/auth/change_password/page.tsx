'use client';

import { FormBtns } from '@/components/formItems/FormBtns';
import { FormErrors } from '@/components/formItems/FormErrors';
import { PasswordField } from '@/components/formItems/PasswordField';
import {
    ChangePasswordAction,
    ChangePasswordFormState,
} from '@/data/actions/auth/ChangePasswordAction';
import { passwordSchema } from '@/data/schemas/authSchemas';
import { useActionState, useState, useTransition } from 'react';

export default function ChangePasswordPage() {
    const [localFields, setLocalFields] = useState({
        password: '',
        cnfPassword: '',
    });

    const [formState, formAction] = useActionState(ChangePasswordAction, {
        message: null,
        validationErrors: [],
    });

    const [isPending, startTransition] = useTransition();

    const displayErrors = formState.validationErrors?.length ? formState.validationErrors : [];

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFields((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validation = passwordSchema.safeParse(localFields);
        if (!validation.success) return;

        const submitData = new FormData();
        submitData.append('password', localFields.password);
        submitData.append('cnfPassword', localFields.cnfPassword);

        startTransition(() => {
            formAction(submitData);
        });
    };

    const handleReset = () => {
        setLocalFields({ password: '', cnfPassword: '' });
        const resetData = new FormData();
        resetData.append('reset', 'yes');
        startTransition(() => {
            formAction(resetData);
        });
    };

    return (
        <div className="relative grid w-full max-w-md place-self-center">
            <form
                id="change-password-form"
                onSubmit={handleSubmit}
                className="border-gunmetal grid w-full max-w-md gap-5 place-self-center rounded-lg border-t-8 bg-white p-8 shadow-md"
                style={{ boxShadow: '0px 2px 6px -2px black' }}
            >
                <div className="border-b border-gray-200 pb-5">
                    <p className="mb-1 text-xl font-semibold text-gray-800">Update Your Password</p>
                    <p className="text-sm font-light text-gray-600">
                        Ensure your account remains secure.
                    </p>
                </div>

                <FormErrors
                    formError={formState.message ?? undefined}
                    validationErrors={displayErrors.length ? displayErrors : undefined}
                />

                <div className="grid gap-3">
                    <PasswordField
                        id="password"
                        label="New Password"
                        placeholder="New Password"
                        value={localFields.password}
                        onChange={handleFieldChange}
                    />
                    <PasswordField
                        id="cnfPassword"
                        label="Confirm New Password"
                        placeholder="Confirm New Password"
                        value={localFields.cnfPassword}
                        onChange={handleFieldChange}
                    />
                    <FormBtns
                        isTransitioningSubmit={isPending}
                        isTransitioningReset={isPending}
                        handleReset={handleReset}
                    />
                </div>
            </form>
        </div>
    );
}
