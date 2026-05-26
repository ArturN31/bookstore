'use client';
import { createContext } from 'react';

export type UserState = {
    user: User;
    profileExists: boolean;
    wishlist: Wishlist[];
    loggedIn: boolean;
    loading: boolean;
    error: string | null;
};

export const DEFAULT_USER: User = {
    id: '',
    created_at: '',
    updated_at: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    street_address: '',
    postcode: '',
    city: '',
    country: '',
    phone_number: '',
    username: '',
    email: '',
};

export const INITIAL_USER_STATE: UserState = {
    user: DEFAULT_USER,
    profileExists: false,
    wishlist: [],
    loggedIn: false,
    loading: false,
    error: null,
};

export type UserActions = {
    refreshProfile: () => Promise<void>;
    refreshWishlist: () => Promise<void>;
    signOut: () => Promise<void>;
};

export type PartialUserPayload = Partial<User> & { id: string };

export type UserAction =
    | { type: 'START_SYNC' }
    | { type: 'START_LOADING' }
    | { type: 'STOP_LOADING' }
    | {
          type: 'SET_SYNCED_DATA';
          payload: { user: PartialUserPayload; profileExists: boolean; wishlist: Wishlist[] };
      }
    | { type: 'UPDATE_PROFILE'; payload: { user: PartialUserPayload; profileExists: boolean } }
    | { type: 'UPDATE_WISHLIST'; payload: Wishlist[] }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'RESET' };

export const UserStateContext = createContext<UserState | undefined>(undefined);
export const UserActionsContext = createContext<UserActions | undefined>(undefined);
