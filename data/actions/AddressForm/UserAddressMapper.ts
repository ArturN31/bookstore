import { Database } from '@/database.types';

type UserUpdate = Database['public']['Tables']['users']['Update'];

const DB_COLUMN_MAP: Record<string, keyof UserUpdate> = {
    firstName: 'first_name',
    lastName: 'last_name',
    dob: 'date_of_birth',
    phoneNumber: 'phone_number',
    streetAddress: 'street_address',
    postcode: 'postcode',
    city: 'city',
    country: 'country',
};

export const mapToUserPayload = (data: Record<string, unknown>): UserUpdate => {
    const payload: UserUpdate = {};

    for (const [key, value] of Object.entries(data)) {
        const dbKey = DB_COLUMN_MAP[key];
        if (dbKey && value !== undefined)
            (payload as Record<keyof UserUpdate, unknown>)[dbKey] = value;
    }

    return payload;
};
