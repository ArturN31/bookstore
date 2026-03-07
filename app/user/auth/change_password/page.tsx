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
    const [formData, setFormData] = useState<ChangePasswordFormState>({
        password: '',
        cnfPassword: '',
        message: undefined,
        validationErrors: [],
    });

    const [formState, formAction] = useActionState(
        async (state: ChangePasswordFormState, payload: FormData) => {
            const result = await ChangePasswordAction(state, payload);
            if (result) setFormData((prev) => ({ ...prev, ...result }));
            return result;
        },
        formData,
    );

    const [isTransitioningSubmit, startTransitionSubmit] = useTransition();
    const [isTransitioningReset, startTransitionReset] = useTransition();

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            const updatedData = { ...prev, [name]: value };
            const validation = passwordSchema.safeParse(updatedData);

            if (validation.success)
                return { ...updatedData, validationErrors: [], message: undefined };

            const filteredIssues = validation.error.issues.filter((issue) => {
                const isCurrentField = issue.path.includes(name);
                const isNotRequiredError =
                    issue.code !== 'invalid_type' &&
                    issue.code !== 'too_small' &&
                    issue.message.toLowerCase() !== 'required';

                return isCurrentField && isNotRequiredError;
            });

            return {
                ...updatedData,
                validationErrors: filteredIssues,
                message: filteredIssues.length > 0 ? 'Validation Issues' : undefined,
            };
        });
    };

    const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
        event.preventDefault();

        const result = passwordSchema.safeParse(formData);

        if (!result.success) {
            setFormData((prev) => ({
                ...prev,
                validationErrors: result.error.issues,
                message: 'Please fix the errors before submitting.',
            }));
            return;
        }

        const submitData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (value) submitData.append(key, value.toString());
        });

        startTransitionSubmit(async () => {
            await formAction(submitData);
        });
    };

    const handleReset = () => {
        startTransitionReset(async () => {
            const resetData = new FormData();
            resetData.append('reset', 'yes');
            await formAction(resetData);

            setFormData({
                password: '',
                cnfPassword: '',
                message: undefined,
                validationErrors: [],
            });
        });
    };

    return (
        <div className="relative grid w-full max-w-md place-self-center">
            <form
                id="change-password-form"
                data-testid="change-password-form"
                aria-label="Change Password Form"
                onSubmit={handleSubmit}
                className="border-gunmetal grid w-full max-w-md gap-5 place-self-center rounded-lg border-t-8 bg-white p-8 shadow-md"
                style={{ boxShadow: '0px 2px 6px -2px black' }}
            >
                <div className="border-b border-gray-200 pb-5">
                    <p className="mb-1 text-xl font-semibold text-gray-800">
                        Let's Update Your Password!
                    </p>
                    <p className="text-sm font-light text-gray-600">
                        Keep your account safe with a new, strong password.
                    </p>
                </div>

                <FormErrors
                    formError={formData.message ?? undefined}
                    validationErrors={
                        formData.validationErrors?.length ? formData.validationErrors : undefined
                    }
                />

                <div className="grid gap-3">
                    <PasswordField
                        id="password"
                        label="Password"
                        placeholder="Enter Password"
                        value={formData.password ?? ''}
                        onChange={handleFieldChange}
                    />
                    <PasswordField
                        id="cnfPassword"
                        label="Confirm Password"
                        placeholder="Confirm Password"
                        value={formData.cnfPassword ?? ''}
                        onChange={handleFieldChange}
                    />
                    <FormBtns
                        isTransitioningSubmit={isTransitioningSubmit}
                        isTransitioningReset={isTransitioningReset}
                        handleReset={handleReset}
                    />
                </div>
            </form>
        </div>
    );
}
