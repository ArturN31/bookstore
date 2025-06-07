import { ZodIssue } from 'zod';

export const FormErrors = ({
	formError,
	isUsernameTaken,
	validationErrors,
}: {
	formError: string | null;
	isUsernameTaken: boolean | undefined;
	validationErrors: ZodIssue[] | undefined;
}) => {
	return (
		<>
			{formError && (
				<div
					className='bg-red-100 border border-red-400 text-red-700 px-4 py-1 rounded relative text-sm'
					role='alert'>
					<strong className='font-bold'>Error:</strong>
					<span className='pl-2 block sm:inline'>{formError}</span>
				</div>
			)}
			{isUsernameTaken && (
				<div
					className='bg-orange-100 border border-orange-400 text-orange-700 px-4 py-1 rounded relative text-sm'
					role='alert'>
					<strong className='font-bold'>Warning:</strong>
					<span className='pl-2 block sm:inline'>Username unavailable.</span>
				</div>
			)}
			{validationErrors && (
				<div
					className='bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-1 rounded relative text-sm'
					role='alert'>
					<strong className='font-bold'>Validation Issues:</strong>
					<ul className='mt-1 list-disc pl-5 text-sm'>
						{validationErrors.map((issue, index) => (
							<li key={index}>{issue.message}.</li>
						))}
					</ul>
				</div>
			)}
		</>
	);
};
