'use client';

import { ChangeEvent, useActionState, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { EmailField } from '@/components/formItems/EmailField';
import { FormBtns } from '@/components/formItems/FormBtns';
import { FormErrors } from '@/components/formItems/FormErrors';
import { PasswordField } from '@/components/formItems/PasswordField';
import { SignInAction } from '@/data/actions/auth/SignInAction';
import { useSearchParams } from 'next/navigation';
import { signInSchema } from '@/data/schemas/authSchemas';
import z from 'zod';

export default function SignInPage() {
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo');

    const [localFields, setLocalFields] = useState({
        email: '',
        password: '',
    });

    const [clientErrors, setClientErrors] = useState<z.core.$ZodIssue[]>([]);

    const [formState, formAction] = useActionState(SignInAction, {
        message: null,
        validationErrors: [],
    });

    const [isTransitioningSubmit, startTransitionSubmit] = useTransition();
    const [isTransitioningReset, startTransitionReset] = useTransition();

    const allValidationErrors = useMemo(() => {
        return [...clientErrors, ...(formState.validationErrors || [])];
    }, [clientErrors, formState.validationErrors]);

    const handleFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const updatedFields = { ...localFields, [name]: value };
        setLocalFields(updatedFields);

        const result = signInSchema.safeParse(updatedFields);
        if (result.success) setClientErrors([]);
        else {
            const fieldErrors = result.error.issues.filter((issue) => issue.path.includes(name));
            setClientErrors(fieldErrors);
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const result = signInSchema.safeParse(localFields);

        if (!result.success) {
            setClientErrors(result.error.issues);
            return;
        }

        setClientErrors([]);

        const submitData = new FormData();
        submitData.append('email', localFields.email);
        submitData.append('password', localFields.password);
        if (returnTo) submitData.append('returnTo', returnTo);

        startTransitionSubmit(() => {
            formAction(submitData);
        });
    };

    const handleReset = () => {
        setLocalFields({ email: '', password: '' });
        setClientErrors([]);

        startTransitionReset(() => {
            const resetData = new FormData();
            resetData.append('reset', 'yes');
            formAction(resetData);
        });
    };

    return (
        <div className="grid gap-5">
            <div className="relative grid w-full max-w-md place-self-center">
                <form
                    id="signin-form"
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
                        formError={formState.message ?? undefined}
                        validationErrors={
                            allValidationErrors.length ? allValidationErrors : undefined
                        }
                    />

                    <div className="grid gap-3">
                        <EmailField
                            email={localFields.email}
                            onChange={handleFieldChange}
                        />

                        <PasswordField
                            id="password"
                            label="Password"
                            placeholder="Password"
                            value={localFields.password}
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
