export const UserConstants = {
    MAX_RETRY_ATTEMPTS: 3,
    BASE_RETRY_DELAY: 1000,
} as const;

export const UserServiceLogPrefix = '[UserService]';

export const UserRepositoryLogPrefix = '[UserRepository]';

export const USER_TABLE = 'users';

export const WISHLIST_TABLE = 'wishlist';

export const USER_ROUTES = {
    PROFILE: '/user/profile',
} as const;

export const USER_DB_COLUMN_MAP = {
    firstName: 'first_name',
    lastName: 'last_name',
    username: 'username',
    dob: 'date_of_birth',
    phoneNumber: 'phone_number',
    streetAddress: 'street_address',
    postcode: 'postcode',
    city: 'city',
    country: 'country',
} as const;
