'use client';

import { ChangeEvent, SyntheticEvent, useActionState, useState, useTransition } from 'react';
import { EmailField } from '@/components/formItems/EmailField';
import { FormBtns } from '@/components/formItems/FormBtns';
import { FormErrors } from '@/components/formItems/FormErrors';
import { PasswordField } from '@/components/formItems/PasswordField';
import { SignUpAction, SignUpFormState } from '@/data/actions/auth/SignUpAction';
import { signUpSchema } from '@/data/schemas/authSchemas';
import Link from 'next/link';

export default function SignUpPage() {
    const [formData, setFormData] = useState<SignUpFormState>({
        email: '',
        password: '',
        cnfPassword: '',
        message: undefined,
        validationErrors: [],
    });

    const [formState, formAction] = useActionState(
        async (state: SignUpFormState, payload: FormData) => {
            const result = await SignUpAction(state, payload);
            if (result) {
                setFormData((prev) => ({ ...prev, ...result }));
            }
            return result;
        },
        formData,
    );

    const [isTransitioningSubmit, startTransitionSubmit] = useTransition();
    const [isTransitioningReset, startTransitionReset] = useTransition();

    const handleFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            const updatedData = { ...prev, [name]: value };
            const validation = signUpSchema.safeParse(updatedData);

            if (validation.success)
                return { ...updatedData, validationErrors: [], message: undefined };

            const filteredIssues = validation.error.issues.filter((issue) => {
                const isCurrentField = issue.path.includes(name);
                const isNotRequiredError =
                    issue.code !== 'invalid_type' &&
                    issue.code !== 'too_small' &&
                    !issue.message.toLowerCase().includes('required');

                return isCurrentField && isNotRequiredError;
            });

            return {
                ...updatedData,
                validationErrors: filteredIssues,
                message: filteredIssues.length > 0 ? 'Validation Issues' : undefined,
            };
        });
    };

    const handleSubmit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
        event.preventDefault();

        const result = signUpSchema.safeParse(formData);

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
            if (value !== undefined && value !== null) {
                submitData.append(key, value.toString());
            }
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
                email: '',
                password: '',
                cnfPassword: '',
                message: undefined,
                validationErrors: [],
            });
        });
    };

    return (
        <div className="grid min-h-[60vh] items-center py-10">
            <div className="relative grid w-full max-w-md place-self-center">
                <form
                    id="signup-form"
                    data-testid="signup-form"
                    onSubmit={handleSubmit}
                    className="border-gunmetal grid w-full max-w-md gap-6 place-self-center rounded-lg border-t-8 bg-white p-8 shadow-md"
                    style={{ boxShadow: '0px 2px 6px -2px black' }}
                >
                    <div className="border-b border-gray-200 pb-5">
                        <h1 className="mb-1 text-xl font-semibold text-gray-800">
                            Create Your Account
                        </h1>
                        <p className="text-sm font-light text-gray-600">
                            Let&apos;s get you started! Please enter your information below.
                        </p>
                    </div>

                    <FormErrors
                        formError={formData.message ?? undefined}
                        validationErrors={
                            formData.validationErrors?.length
                                ? formData.validationErrors
                                : undefined
                        }
                    />

                    <div className="grid gap-4">
                        <EmailField
                            email={formData.email ?? ''}
                            onChange={handleFieldChange}
                        />

                        <PasswordField
                            id="password"
                            label="Password"
                            placeholder="Password"
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

                        <div className="pt-2">
                            <FormBtns
                                isTransitioningSubmit={isTransitioningSubmit}
                                isTransitioningReset={isTransitioningReset}
                                handleReset={handleReset}
                            />
                        </div>
                    </div>
                </form>
            </div>

            <p className="mt-5 text-center">
                Already have an account? Log in&nbsp;
                <Link
                    href="/user/auth/signin"
                    className="font-medium text-sky-500 transition-colors hover:text-sky-700"
                >
                    here
                </Link>
                .
            </p>
        </div>
    );
}
