import { PostgrestError } from '@supabase/supabase-js';

export const handleUsernameUpdateError = (error: PostgrestError) => {
    const isTaken = error.code === '23505';

    return {
        message: isTaken
            ? 'This username is already taken.'
            : 'Failed to update username. Please try again later.',
        isUsernameTaken: isTaken,
        error: error,
    };
};
