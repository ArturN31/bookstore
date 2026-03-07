'use client';

import { ChangeEvent, useActionState, useState, useTransition } from 'react';
import Link from 'next/link';
import { EmailField } from '@/components/formItems/EmailField';
import { FormBtns } from '@/components/formItems/FormBtns';
import { FormErrors } from '@/components/formItems/FormErrors';
import { PasswordField } from '@/components/formItems/PasswordField';
import { SignInAction, SignInFormState } from '@/data/actions/auth/SignInAction';
import { useSearchParams } from 'next/navigation';
import { signInSchema } from '@/data/schemas/authSchemas';

export default function SignInPage() {
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo');

    const [formData, setFormData] = useState<SignInFormState>({
        email: '',
        password: '',
        message: undefined,
        validationErrors: [],
    });

    const [formState, formAction] = useActionState(
        async (state: SignInFormState, payload: FormData) => {
            const result = await SignInAction(state, payload);
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
            const validation = signInSchema.safeParse(updatedData);

            if (validation.success)
                return { ...updatedData, validationErrors: [], message: undefined };

            const filteredIssues = validation.error.issues.filter((issue) => {
                const isCurrentField = issue.path.includes(name);
                const isNotRequiredError =
                    issue.code !== 'invalid_type' &&
                    issue.code !== 'too_small' &&
                    issue.message.toLowerCase() !== 'required' &&
                    issue.message.toLowerCase() !== 'email is required';

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

        const result = signInSchema.safeParse(formData);

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

        if (returnTo) submitData.append('returnTo', returnTo);

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
                message: undefined,
                validationErrors: [],
            });
        });
    };

    return (
        <div className="grid gap-5">
            <div className="relative grid w-full max-w-md place-self-center">
                <form
                    id="signin-form"
                    data-testid="signin-form"
                    aria-label="Sign In Form"
                    onSubmit={handleSubmit}
                    className="border-gunmetal grid w-full max-w-md gap-5 place-self-center rounded-lg border-t-8 bg-white p-8 shadow-md"
                    style={{ boxShadow: '0px 2px 6px -2px black' }}
                >
                    <div className="border-b border-gray-200 pb-5">
                        <h1 className="mb-1 text-xl font-semibold text-gray-800">
                            Welcome Back, Bookworm!
                        </h1>
                        <p className="text-sm font-light text-gray-600">
                            Enter your details to access your bookish adventures.
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

                    <div className="grid gap-3">
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

                        <input
                            type="hidden"
                            name="returnTo"
                            value={returnTo ?? ''}
                        />

                        <FormBtns
                            isTransitioningSubmit={isTransitioningSubmit}
                            isTransitioningReset={isTransitioningReset}
                            handleReset={handleReset}
                        />
                    </div>
                </form>
            </div>

            <p className="text-center">
                New to Books 4 You? Create an account&nbsp;
                <Link
                    href="/user/auth/signup"
                    className="font-medium text-sky-500 transition-colors hover:text-sky-700"
                >
                    here
                </Link>
                .
            </p>
        </div>
    );
}
