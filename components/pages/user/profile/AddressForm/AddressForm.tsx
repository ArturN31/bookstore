'use client';

import { useActionState, useState, useTransition } from 'react';
import {
    UserAddressAction,
    type UserAddressFormState,
} from '@/data/actions/AddressForm/UserAddressAction';
import { addressSchema, fullUserSchema } from '@/data/schemas/addressSchema';
import { FormBtns } from '@/components/formItems/FormBtns';
import { FormErrors } from '@/components/formItems/FormErrors';
import { TextInput } from '@/components/formItems/TextInput';
import { UserPersonalFields } from './UserPersonalFields';

interface AddressFormProps {
    mode: 'add' | 'update';
    initialData?: Partial<UserAddressFormState>;
}

export const AddressForm = ({ mode, initialData }: AddressFormProps) => {
    const isAddMode = mode === 'add';
    const activeSchema = isAddMode ? fullUserSchema : addressSchema;

    const [formData, setFormData] = useState<UserAddressFormState>({
        firstName: initialData?.firstName ?? '',
        lastName: initialData?.lastName ?? '',
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
        async (state: UserAddressFormState, payload: FormData) => {
            const result = await UserAddressAction(mode, state, payload);
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
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
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
                firstName: '',
                lastName: '',
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
                id={`${mode}-address-form`}
                onSubmit={handleSubmit}
                className="grid gap-5 rounded-lg border-t-8 border-gray-800 bg-white p-8 shadow-md"
            >
                <div>
                    <h1 className="text-xl font-semibold">
                        {isAddMode ? 'Shipping Address' : 'Update Address'}
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
                            value={formData.streetAddress ?? ''}
                            onChange={handleFieldChange}
                        />
                        <TextInput
                            label="Postcode"
                            id="postcode"
                            value={formData.postcode ?? ''}
                            onChange={handleFieldChange}
                        />
                    </div>

                    <div className="flex gap-3">
                        <TextInput
                            label="City"
                            id="city"
                            value={formData.city ?? ''}
                            onChange={handleFieldChange}
                        />
                        <TextInput
                            label="Country"
                            id="country"
                            value={formData.country ?? ''}
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
