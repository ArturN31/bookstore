'use client';

import { JSX } from 'react';
import { useRouter } from 'next/navigation';

export function BackButton(): JSX.Element {
    const router = useRouter();

    return (
        <button
            type="button"
            onClick={() => router.back()}
            className="text-gunmetal hover:text-yellow inline-flex items-center text-sm font-medium transition-colors hover:cursor-pointer"
        >
            <span className="mr-1.5 text-base">&larr;</span> Back
        </button>
    );
}
