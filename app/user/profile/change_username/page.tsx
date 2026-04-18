'use client';

import { FormBtns } from '@/components/formItems/FormBtns';
import { FormErrors } from '@/components/formItems/FormErrors';
import {
    ChangeUsernameAction,
    ChangeUsernameFormState,
} from '@/data/actions/UsernameForm/ChangeUsernameAction';
import { useActionState, useEffect, useState, useTransition } from 'react';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

export default function ChangeUsernamePage() {
    const INITIAL_STATE: ChangeUsernameFormState = {
        username: '',
        message: undefined,
        validationErrors: undefined,
        isUsernameTaken: false,
    };
    const [formState, formAction] = useActionState(ChangeUsernameAction, INITIAL_STATE);
    const [formError, setFormError] = useState<string | undefined>(undefined);
    const [isTransitioningSubmit, startTransitionSubmit] = useTransition();
    const [isTransitioningReset, startTransitionReset] = useTransition();
    const { username, message, validationErrors, isUsernameTaken } = formState;

    useEffect(() => {
        if (message) setFormError(message);
        else setFormError(undefined);
    }, [message]);

    const handleReset = async () => {
        const inputElement = document.getElementById('username-field') as HTMLInputElement | null;
        if (inputElement) {
            inputElement.value = '';
            const form = document.getElementById('change-username-form') as HTMLFormElement;
            if (form) {
                startTransitionReset(async () => {
                    const newForm = new FormData(form);
                    newForm.append('reset', 'yes');
                    await formAction(newForm);
                });
            }
        }
    };

    const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
        event.preventDefault();
        const form = event.currentTarget as HTMLFormElement;
        startTransitionSubmit(async () => {
            await formAction(new FormData(form));
        });
    };

    return (
        <div className="relative grid w-full max-w-md place-self-center">
            <form
                id="change-username-form"
                data-testid="change-username-form"
                action={formAction}
                onSubmit={handleSubmit}
                className="border-gunmetal grid w-full max-w-md gap-5 place-self-center rounded-lg border-t-8 bg-white p-8 shadow-md"
                style={{ boxShadow: '0px 2px 6px -2px black' }}
            >
                <div className="border-b border-gray-200 pb-5">
                    <h1 className="mb-1 text-xl font-semibold text-gray-800">Edit Username</h1>
                    <p className="text-sm font-light text-gray-600">Change your public name.</p>
                </div>
                <div className="grid gap-3">
                    <FormErrors
                        formError={formError}
                        validationErrors={validationErrors}
                    />

                    <div className="relative grid w-full max-w-md place-self-center">
                        <label
                            htmlFor="username"
                            className="inline-block rounded-sm px-1 text-sm font-medium text-gray-700 transition-colors duration-200 focus-within:bg-blue-100 focus-within:text-blue-700"
                        >
                            New Username
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute top-2 flex items-center pl-3 text-gray-400">
                                <PersonRoundedIcon aria-hidden="true" />
                            </div>
                            <input
                                autoComplete="off"
                                required
                                type="text"
                                id="username-field"
                                data-testid="username-field"
                                name="username"
                                placeholder="Enter your new username"
                                defaultValue={username ?? ''}
                                className="block w-full rounded-md border border-gray-300 py-2 pl-10 text-sm focus:border-blue-500 focus:outline-none"
                                aria-describedby="username-helper"
                            />
                        </div>
                        <p
                            id="username-helper"
                            className="text-xs text-gray-500"
                        >
                            This will be your public display name.
                        </p>
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
}
