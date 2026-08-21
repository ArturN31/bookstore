'use client';

import { useActionState, useState, useTransition } from 'react';
import {
    OnboardingAction,
    type OnboardingFormState,
} from '@/data/user/onboarding/OnboardingAction';
import { addressSchema, fullUserSchema } from '@/data/schemas/onboardingSchema';
import { FormBtns } from '@/components/formItems/FormBtns';
import { FormErrors } from '@/components/formItems/FormErrors';
import { TextInput } from '@/components/formItems/TextInput';
import { z } from 'zod';
import { UserPersonalFields } from './UserPersonalFields';

export interface OnboardingFormFields {
    firstName: string;
    lastName: string;
    username: string;
    dob: string;
    streetAddress: string;
    postcode: string;
    city: string;
    country: string;
    phoneNumber: string;
    message: string | null;
    validationErrors: z.core.$ZodIssue[];
}

interface OnboardingFormProps {
    mode: 'add' | 'update';
    initialData?: Partial<Omit<OnboardingFormFields, 'message' | 'validationErrors'>>;
}

export const OnboardingForm = ({ mode, initialData }: OnboardingFormProps) => {
    const isAddMode = mode === 'add';
    const activeSchema = isAddMode ? fullUserSchema : addressSchema;

    const [formData, setFormData] = useState<OnboardingFormFields>({
        firstName: initialData?.firstName ?? '',
        lastName: initialData?.lastName ?? '',
        username: initialData?.username ?? '',
        dob: initialData?.dob ?? '',
        streetAddress: initialData?.streetAddress ?? '',
        postcode: initialData?.postcode ?? '',
        city: initialData?.city ?? '',
        country: initialData?.country ?? '',
        phoneNumber: initialData?.phoneNumber ?? '',
        message: null,
        validationErrors: [],
    });

    const [formState, formAction] = useActionState(
        async (state: OnboardingFormState, payload: FormData) => {
            const result = await OnboardingAction(mode, state, payload);
            if (result) {
                setFormData((prev) => ({
                    ...prev,
                    message: result.message ?? null,
                    validationErrors: (result.validationErrors as z.core.$ZodIssue[]) ?? [],
                }));
            }
            return result;
        },
        { message: null, validationErrors: [] },
    );

    const [isTransitioningSubmit, startTransitionSubmit] = useTransition();
    const [isTransitioningReset, startTransitionReset] = useTransition();

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            const updatedData = { ...prev, [name]: value };
            const validation = activeSchema.safeParse(updatedData);

            if (validation.success) return { ...updatedData, validationErrors: [], message: null };

            const filteredIssues = validation.error.issues.filter((issue) => {
                const isCurrentField = issue.path.includes(name);
                const isNotRequiredError =
                    issue.code !== 'invalid_type' && issue.message.toLowerCase() !== 'required';

                return isCurrentField && isNotRequiredError;
            });

            return {
                ...updatedData,
                validationErrors: filteredIssues,
                message: filteredIssues.length > 0 ? 'Validation Issues' : null,
            };
        });
    };

    const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
        event.preventDefault();

        const result = activeSchema.safeParse(formData);

        if (!result.success) {
            setFormData((prev) => ({
                ...prev,
                validationErrors: result.error.issues,
                message: 'Please fix the errors before submitting.',
            }));
            return;
        }

        const submitData = new FormData();

        const dataKeys: (keyof OnboardingFormFields)[] = [
            'firstName',
            'lastName',
            'username',
            'dob',
            'streetAddress',
            'postcode',
            'city',
            'country',
            'phoneNumber',
        ];

        dataKeys.forEach((key) => {
            const value = formData[key];
            if (value !== null && value !== undefined) submitData.append(key, value.toString());
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
                firstName: '',
                lastName: '',
                username: '',
                dob: '',
                streetAddress: '',
                postcode: '',
                city: '',
                country: '',
                phoneNumber: '',
                message: null,
                validationErrors: [],
            });
        });
    };

    return (
        <div className="relative grid w-full max-w-md place-self-center">
            <form
                id={`${mode}-onboarding-form`}
                onSubmit={handleSubmit}
                className="grid gap-5 rounded-lg border-t-8 border-gray-800 bg-white p-8 shadow-md"
            >
                <div>
                    <h1 className="text-xl font-semibold">
                        {isAddMode ? 'Welcome - Complete Your Profile' : 'Update Address'}
                    </h1>
                </div>

                <FormErrors
                    formError={formData.message ?? undefined}
                    validationErrors={
                        formData.validationErrors?.length ? formData.validationErrors : undefined
                    }
                />

                <div className="grid gap-3">
                    {isAddMode && (
                        <UserPersonalFields
                            formData={formData}
                            onChange={handleFieldChange}
                        />
                    )}

                    <div className="flex gap-3">
                        <TextInput
                            label="Street Address"
                            id="streetAddress"
                            value={formData.streetAddress}
                            onChange={handleFieldChange}
                        />
                        <TextInput
                            label="Postcode"
                            id="postcode"
                            value={formData.postcode}
                            onChange={handleFieldChange}
                        />
                    </div>

                    <div className="flex gap-3">
                        <TextInput
                            label="City"
                            id="city"
                            value={formData.city}
                            onChange={handleFieldChange}
                        />
                        <TextInput
                            label="Country"
                            id="country"
                            value={formData.country}
                            onChange={handleFieldChange}
                        />
                    </div>

                    <FormBtns
                        isTransitioningSubmit={isTransitioningSubmit}
                        isTransitioningReset={isTransitioningReset}
                        handleReset={handleReset}
                    />
                </div>
            </form>
        </div>
    );
};
