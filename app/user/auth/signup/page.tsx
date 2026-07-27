'use client';

import { ChangeEvent, useActionState, useState, useTransition, useMemo, useRef } from 'react';
import { EmailField } from '@/components/formItems/EmailField';
import { FormBtns } from '@/components/formItems/FormBtns';
import { FormErrors } from '@/components/formItems/FormErrors';
import { PasswordField } from '@/components/formItems/PasswordField';
import { SignUpAction } from '@/data/actions/auth/SignUpAction';
import { signUpSchema } from '@/data/schemas/authSchemas';
import Link from 'next/link';
import { z } from 'zod';
import HCaptcha from '@hcaptcha/react-hcaptcha';

export default function SignUpPage() {
    const captchaRef = useRef<HCaptcha>(null);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    const [localFields, setLocalFields] = useState({
        email: '',
        password: '',
        cnfPassword: '',
    });

    const [clientErrors, setClientErrors] = useState<z.core.$ZodIssue[]>([]);

    const [formState, formAction] = useActionState(SignUpAction, {
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

        const result = signUpSchema.safeParse(updatedFields);
        if (result.success) setClientErrors([]);
        else {
            const fieldErrors = result.error.issues.filter(
                (issue) =>
                    issue.path.includes(name) ||
                    (name === 'cnfPassword' && issue.code === 'custom'),
            );
            setClientErrors(fieldErrors);
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!captchaToken) {
            setClientErrors([
                {
                    code: 'custom',
                    path: ['captcha'],
                    message: 'Please complete the Captcha challenge before submitting the form',
                } as z.core.$ZodIssue,
            ]);
        }

        const result = signUpSchema.safeParse(localFields);

        if (!result.success) {
            setClientErrors(result.error.issues);
            return;
        }

        setClientErrors([]);

        const submitData = new FormData();
        submitData.append('email', localFields.email);
        submitData.append('password', localFields.password);
        submitData.append('cnfPassword', localFields.cnfPassword);
        submitData.append('captchaToken', captchaToken || '');

        startTransitionSubmit(() => {
            formAction(submitData);

            captchaRef.current?.resetCaptcha();
            setCaptchaToken(null);
        });
    };

    const handleReset = () => {
        setLocalFields({
            email: '',
            password: '',
            cnfPassword: '',
        });
        setClientErrors([]);
        captchaRef.current?.resetCaptcha();
        setCaptchaToken(null);

        startTransitionReset(() => {
            const resetData = new FormData();
            resetData.append('reset', 'yes');
            formAction(resetData);
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
                        formError={formState.message ?? undefined}
                        validationErrors={
                            allValidationErrors.length ? allValidationErrors : undefined
                        }
                    />

                    <div className="grid gap-4">
                        <EmailField
                            email={localFields.email}
                            onChange={handleFieldChange}
                        />

                        <PasswordField
                            id="password"
                            label="Password"
                            placeholder="Create a strong password"
                            value={localFields.password}
                            onChange={handleFieldChange}
                        />

                        <PasswordField
                            id="cnfPassword"
                            label="Confirm Password"
                            placeholder="Repeat password"
                            value={localFields.cnfPassword}
                            onChange={handleFieldChange}
                        />

                        <div className="flex justify-center py-2">
                            <HCaptcha
                                ref={captchaRef}
                                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ''}
                                onVerify={(token) => setCaptchaToken(token)}
                                onExpire={() => setCaptchaToken(null)}
                            />
                        </div>

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
