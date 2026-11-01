export type CandidateCapacityError = Error & {
    name: 'CandidateCapacityError';
    requestedCount: number;
    availableCount: number;
};

const createCandidateCapacityError = (
    requestedCount: number,
    availableCount: number,
): CandidateCapacityError =>
    Object.assign(
        new Error(
            `Unable to generate exactly ${requestedCount} records; only ${availableCount} unique candidates were found during planning.`,
        ),
        { name: 'CandidateCapacityError' as const, requestedCount, availableCount },
    );

export const isCandidateCapacityError = (error: unknown): error is CandidateCapacityError =>
    error instanceof Error && error.name === 'CandidateCapacityError';

export const assertValidRequestedCount = (requestedCount: number): void => {
    if (!Number.isInteger(requestedCount) || requestedCount < 0)
        throw new RangeError('Requested count must be a non-negative integer.');
};

export const normalizeNaturalKey = (value: string): string =>
    value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-GB');

export const naturalPairKey = (...values: string[]): string =>
    JSON.stringify(values.map(normalizeNaturalKey));

export const planUniqueCandidates = <T>(
    candidates: Iterable<T>,
    requestedCount: number,
    getKeys: (candidate: T) => readonly string[],
    existingKeys: Iterable<string> = [],
): T[] => {
    assertValidRequestedCount(requestedCount);

    if (requestedCount === 0) return [];

    const planned = [...candidates].reduce<{
        candidates: T[];
        reservedKeys: Set<string>;
    }>(
        (result, candidate) => {
            const candidateKeys = [...new Set(getKeys(candidate))];
            if (candidateKeys.length === 0 || candidateKeys.some((key) => key.length === 0))
                throw new Error(
                    'Each candidate must provide at least one non-empty uniqueness key.',
                );

            if (candidateKeys.some((key) => result.reservedKeys.has(key))) return result;

            candidateKeys.forEach((key) => result.reservedKeys.add(key));
            result.candidates.push(candidate);
            return result;
        },
        { candidates: [], reservedKeys: new Set(existingKeys) },
    ).candidates;

    if (planned.length < requestedCount)
        throw createCandidateCapacityError(requestedCount, planned.length);

    return planned.slice(0, requestedCount);
};

export const sampleUniqueCandidates = <T>(
    candidates: Iterable<T>,
    requestedCount: number,
    getKeys: (candidate: T) => readonly string[],
    existingKeys: Iterable<string>,
    random: () => number,
): T[] => {
    assertValidRequestedCount(requestedCount);

    if (requestedCount === 0) return [];

    const selection = [...candidates].reduce<{
        reservedKeys: Set<string>;
        sample: T[];
        availableCount: number;
    }>(
        (result, candidate) => {
            const candidateKeys = [...new Set(getKeys(candidate))];
            if (candidateKeys.length === 0 || candidateKeys.some((key) => key.length === 0))
                throw new Error(
                    'Each candidate must provide at least one non-empty uniqueness key.',
                );

            if (candidateKeys.some((key) => result.reservedKeys.has(key))) return result;

            candidateKeys.forEach((key) => result.reservedKeys.add(key));
            const availableCount = result.availableCount + 1;

            if (result.sample.length < requestedCount)
                return { ...result, sample: [...result.sample, candidate], availableCount };

            const replacementIndex = Math.floor(random() * availableCount);
            const sample =
                replacementIndex < requestedCount
                    ? result.sample.map((item, index) =>
                          index === replacementIndex ? candidate : item,
                      )
                    : result.sample;

            return { ...result, sample, availableCount };
        },
        { reservedKeys: new Set(existingKeys), sample: [], availableCount: 0 },
    );

    if (selection.sample.length !== requestedCount)
        throw createCandidateCapacityError(requestedCount, selection.availableCount);

    return selection.sample;
};
