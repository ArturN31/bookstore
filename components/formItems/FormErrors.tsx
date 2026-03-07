import { z } from 'zod';

export const FormErrors = ({
    formError,
    validationErrors,
}: {
    formError: string | undefined;
    validationErrors: z.core.$ZodIssue[] | undefined;
}) => {
    return (
        <>
            {formError && (
                <div
                    className="relative rounded border border-red-400 bg-red-100 px-4 py-1 text-sm text-red-700"
                    role="alert"
                    data-testid="form-error-display"
                >
                    <strong className="font-bold">Error:</strong>
                    <span className="block pl-2 sm:inline">{formError}</span>
                </div>
            )}
            {validationErrors && (
                <div
                    className="relative rounded border border-yellow-400 bg-yellow-100 px-4 py-1 text-sm text-yellow-700"
                    role="alert"
                >
                    <strong className="font-bold">Validation Issues:</strong>
                    <ul className="mt-1 list-disc pl-5 text-sm">
                        {validationErrors.map((issue, index) => (
                            <li key={index}>{issue.message}.</li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
};
