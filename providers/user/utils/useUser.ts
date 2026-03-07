'use client';

import { useContext } from 'react';
import { UserActionsContext, UserStateContext } from '@/providers/user/UserContext';

export const useUserState = () => {
    const context = useContext(UserStateContext);
    if (!context) throw new Error('useUserState must be used within UserProvider');
    return context;
};

export const useUserActions = () => {
    const context = useContext(UserActionsContext);
    if (!context) throw new Error('useUserActions must be used within UserProvider');
    return context;
};
