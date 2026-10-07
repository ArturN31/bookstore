'use client';

import { JSX } from 'react';
import Link from 'next/link';
import { Paper, Typography } from '@mui/material';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';

export function CheckoutEmptyCart(): JSX.Element {
    return (
        <div className="flex min-h-[65vh] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
            <Paper
                elevation={0}
                className="w-full max-w-lg rounded-3xl border border-stone-200 bg-[#fbf9f5] p-12 text-center shadow-sm"
            >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-200 text-stone-800">
                    <MenuBookOutlinedIcon fontSize="large" />
                </div>
                <Typography
                    variant="h5"
                    component="h1"
                    className="mb-2 font-serif font-bold tracking-tight text-stone-900"
                >
                    Your Bookshelf is Empty
                </Typography>
                <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-stone-600">
                    {APP_ERROR_MESSAGES.EMPTY_CART_CHECKOUT} Discover our curated collection of
                    titles.
                </p>
                <Link
                    href="/"
                    className="bg-yellow hover:bg-yellow/75 text-gunmetal inline-block w-full rounded-2xl px-6 py-3.5 text-center font-semibold shadow-md transition duration-200"
                >
                    Explore Bookstore Catalog
                </Link>
            </Paper>
        </div>
    );
}
