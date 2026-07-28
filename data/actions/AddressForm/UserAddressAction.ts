'use server';

import { addressSchema, fullUserSchema } from '@/data/schemas/addressSchema';
import { createBackendClient } from '@/utils/db/server';
import { z } from 'zod';
import { mapToUserPayload } from './UserAddressMapper';
import { insertUserAddress, updateUserAddress } from './UserAddressRepository';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Database } from '@/database.types';

type UserInsert = Database['public']['Tables']['users']['Insert'];

export type UserAddressFormState = {
    message?: string | null;
    validationErrors?: z.core.$ZodIssue[];
    error?: string | null;
};

const INITIAL_EMPTY_STATE: UserAddressFormState = {
    message: null,
    validationErrors: undefined,
    error: null,
};

export async function UserAddressAction(
    mode: 'add' | 'update',
    prevState: UserAddressFormState,
    formData: FormData,
): Promise<UserAddressFormState> {
    const rawData = Object.fromEntries(formData.entries());

    if (rawData.reset) return INITIAL_EMPTY_STATE;

    const schema = mode === 'add' ? fullUserSchema : addressSchema;
    const validated = schema.safeParse(rawData);

    if (!validated.success)
        return {
            validationErrors: validated.error.issues,
            message: 'Please correct the highlighted errors.',
        };

    const supabase = await createBackendClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { message: 'Session expired. Please log in again.' };

    const payload = mapToUserPayload(validated.data);

    const { error: dbError } =
        mode === 'add'
            ? await insertUserAddress(supabase, { id: user.id, ...payload } as UserInsert)
            : await updateUserAddress(supabase, user.id, payload);

    if (dbError)
        return {
            message: 'Failed to save address details.',
            error: dbError,
        };

    revalidatePath('/user/profile');
    redirect('/user/profile');
}
