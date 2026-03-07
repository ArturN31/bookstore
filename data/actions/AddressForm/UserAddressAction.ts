'use server';

import { z } from 'zod';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addressSchema, fullUserSchema } from '@/data/schemas/addressSchema';

export type UserAddressFormState = {
    firstName?: string;
    lastName?: string;
    dob?: string;
    phoneNumber?: string;
    streetAddress?: string;
    postcode?: string;
    city?: string;
    country?: string;
    message?: string | null;
    validationErrors?: z.core.$ZodIssue[];
    error?: any;
};

const DB_MAP: Partial<Record<keyof UserAddressFormState, string>> = {
    firstName: 'first_name',
    lastName: 'last_name',
    dob: 'date_of_birth',
    phoneNumber: 'phone_number',
    streetAddress: 'street_address',
    postcode: 'postcode',
    city: 'city',
    country: 'country',
};

const mapToDbPayload = (data: Partial<UserAddressFormState>) => {
    const payload: Record<string, string | undefined> = {};

    for (const key in data) {
        const typedKey = key as keyof UserAddressFormState;
        const dbKey = DB_MAP[typedKey];

        if (dbKey) payload[dbKey] = data[typedKey] as string;
    }

    return payload;
};

export async function UserAddressAction(
    mode: 'add' | 'update',
    prevState: UserAddressFormState,
    formData: FormData,
): Promise<UserAddressFormState> {
    const rawData = Object.fromEntries(formData.entries()) as Record<string, string>;

    if (rawData.reset)
        return {
            firstName: '',
            lastName: '',
            dob: '',
            phoneNumber: '',
            streetAddress: '',
            postcode: '',
            city: '',
            country: '',
            message: null,
            validationErrors: undefined,
        };

    const schema = mode === 'add' ? fullUserSchema : addressSchema;
    const validated = schema.safeParse(rawData);

    if (!validated.success)
        return {
            ...rawData,
            validationErrors: validated.error.issues,
            message: 'Please correct the errors.',
        };

    const supabase = await createBackendClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { ...rawData, message: 'Authentication failed. Please log in.' };

    const payload = mapToDbPayload(validated.data);
    const query =
        mode === 'add'
            ? supabase.from('users').insert({ id: user.id, ...payload })
            : supabase.from('users').update(payload).eq('id', user.id);

    const { error: dbError } = await query;

    if (dbError) return { ...rawData, message: 'Database error occurred.', error: dbError };

    revalidatePath('/user/profile');
    redirect('/user/profile');
}
