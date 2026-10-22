import { validateLocalSupabaseApiUrl } from './supabaseIntegration';

describe('validateLocalSupabaseApiUrl', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('rejects Supabase service URLs instead of the API base URL', async () => {
        const fetchSpy = jest.spyOn(global, 'fetch');

        await expect(
            validateLocalSupabaseApiUrl('http://127.0.0.1:54321/rest/v1'),
        ).rejects.toThrow('not REST_URL, DB_URL, or a Storage URL');
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('checks that the local base URL responds as the Supabase API', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValueOnce(
            new Response('{}', {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }),
        );

        await expect(validateLocalSupabaseApiUrl('http://127.0.0.1:54321')).resolves.toBe(
            'http://127.0.0.1:54321',
        );
        expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:54321/auth/v1/health');
    });

    it('rejects an endpoint that is not the Supabase auth API', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValueOnce(
            new Response('<Error />', {
                status: 200,
                headers: { 'content-type': 'application/xml' },
            }),
        );

        await expect(validateLocalSupabaseApiUrl('http://127.0.0.1:54321')).rejects.toThrow(
            'does not point to the local Supabase API',
        );
    });
});
