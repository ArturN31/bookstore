/**
 * Utility to retry asynchronous operations with exponential backoff.
 */
export const withRetry = async <T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseBackoff = 1000,
): Promise<T> => {
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            return await fn();
        } catch (err) {
            attempt++;

            // Identify transient network/fetch failures
            const errorMessage = err instanceof Error ? err.message : String(err);
            const isTransientError =
                errorMessage.includes('fetch failed') ||
                errorMessage.includes('timeout') ||
                errorMessage.includes('UND_ERR_CONNECT_TIMEOUT');

            if (attempt >= maxRetries || !isTransientError) {
                throw err;
            }

            // Exponential backoff: 1s, 2s, 4s...
            const delayTime = baseBackoff * Math.pow(2, attempt - 1);
            await new Promise((res) => setTimeout(res, delayTime));

            console.warn(`[RetryUtility] Attempt ${attempt} failed. Retrying in ${delayTime}ms...`);
        }
    }

    throw new Error('Operation failed after maximum retry attempts.');
};
