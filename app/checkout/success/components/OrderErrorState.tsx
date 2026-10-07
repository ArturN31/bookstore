import { JSX } from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';
import Link from 'next/link';

export interface OrderErrorStateProps {
    readonly title: string;
    readonly message: string;
}

export function OrderErrorState({ title, message }: OrderErrorStateProps): JSX.Element {
    return (
        <main className="flex min-h-[50vh] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <Box className="w-full max-w-md">
                <Alert
                    severity="error"
                    className="rounded-2xl border border-red-200"
                >
                    <AlertTitle className="font-bold">{title}</AlertTitle>
                    {message}
                </Alert>
                <Box className="mt-6 text-center">
                    <Button
                        component={Link}
                        href="/"
                        variant="outlined"
                        className="rounded-xl border-gray-300 font-bold text-gray-700 normal-case"
                    >
                        Return to Storefront
                    </Button>
                </Box>
            </Box>
        </main>
    );
}
