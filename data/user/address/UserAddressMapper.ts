import { Database } from '@/database.types';
import { USER_DB_COLUMN_MAP } from '../UserConstants';

type UserUpdate = Database['public']['Tables']['users']['Update'];

export const mapToUserPayload = (data: Record<string, unknown>): UserUpdate => {
    const payload: UserUpdate = {};

    for (const [key, value] of Object.entries(data)) {
        const dbKey = USER_DB_COLUMN_MAP[key as keyof typeof USER_DB_COLUMN_MAP];
        if (dbKey && value !== undefined)
            (payload as Record<keyof UserUpdate, unknown>)[dbKey] = value;
    }

    return payload;
};
