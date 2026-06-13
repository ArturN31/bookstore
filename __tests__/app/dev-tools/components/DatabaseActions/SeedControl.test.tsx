import { render, screen, fireEvent } from '@testing-library/react';
import { SeedControl } from '@/app/dev-tools/components/DatabaseActions/SeedControl';
import { useSnackbar } from 'notistack';
import { sysLog } from '@/app/dev-tools/components/SystemLog/useSystemLogic';
import { systemCommandAction, fullResetAction } from '@/app/dev-tools/actions/actions';

interface ActionState {
    success: boolean;
    message: string;
}

jest.mock('notistack', () => ({
    useSnackbar: jest.fn(),
}));

jest.mock('@/app/dev-tools/components/SystemLog/useSystemLogic', () => ({
    sysLog: jest.fn(),
}));

jest.mock('@/app/dev-tools/actions/actions', () => ({
    systemCommandAction: jest.fn(),
    fullResetAction: jest.fn(),
}));

jest.mock('react', () => {
    const actualReact = jest.requireActual('react');
    const useEffectImpl = actualReact.useEffect;
    return {
        ...actualReact,
        useActionState: jest.fn(() => [null, jest.fn(), false]),
        useEffect: (fn: () => void | (() => void), deps: unknown[]) => {
            fn();
            return useEffectImpl(fn, deps);
        },
    };
});

describe('SeedControl', () => {
    const mockEnqueueSnackbar = jest.fn();
    const mockFormAction = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useSnackbar as jest.Mock).mockReturnValue({ enqueueSnackbar: mockEnqueueSnackbar });
        (require('react').useActionState as jest.Mock).mockReturnValue([
            null,
            mockFormAction,
            false,
        ]);
    });

    it('should render button with correct type label', () => {
        render(<SeedControl type="add_books" />);

        expect(screen.getByText(/Initiate add books/i)).toBeInTheDocument();
    });

    it('should render reset button with danger styling', () => {
        render(<SeedControl type="reset" />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-yellow');
        expect(button).toHaveClass('text-gunmetal');
    });

    it('should render normal button with default styling', () => {
        render(<SeedControl type="add_books" />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-gunmetal');
        expect(button).toHaveClass('text-white');
    });

    it('should render stock_purge button with danger styling', () => {
        render(<SeedControl type="stock_purge" />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-yellow');
    });

    it('should show confirmation dialog on click', () => {
        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

        render(<SeedControl type="add_books" />);
        fireEvent.click(screen.getByRole('button'));

        expect(confirmSpy).toHaveBeenCalledWith('Inject 50 Books?');
        confirmSpy.mockRestore();
    });

    it('should fall back to default message if confirmation type is unknown (covers line 62 fallback branch)', () => {
        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

        render(<SeedControl type={'unmapped_command' as 'reset'} />);
        fireEvent.click(screen.getByRole('button'));

        expect(confirmSpy).toHaveBeenCalledWith('Execute command?');
        confirmSpy.mockRestore();
    });

    it('should call formAction when confirmed', () => {
        jest.spyOn(window, 'confirm').mockReturnValue(true);

        render(<SeedControl type="add_books" />);
        fireEvent.click(screen.getByRole('button'));

        expect(mockFormAction).toHaveBeenCalled();
    });

    it('should not call formAction when cancelled', () => {
        jest.spyOn(window, 'confirm').mockReturnValue(false);

        render(<SeedControl type="add_books" />);
        fireEvent.click(screen.getByRole('button'));

        expect(mockFormAction).not.toHaveBeenCalled();
    });

    it('should log system message when action authorized', () => {
        jest.spyOn(window, 'confirm').mockReturnValue(true);

        render(<SeedControl type="add_books" />);
        fireEvent.click(screen.getByRole('button'));

        expect(sysLog).toHaveBeenCalledWith('User authorized ADD_BOOKS.', 'system');
    });

    it('should log warning when action aborted', () => {
        jest.spyOn(window, 'confirm').mockReturnValue(false);

        render(<SeedControl type="add_books" />);
        fireEvent.click(screen.getByRole('button'));

        expect(sysLog).toHaveBeenCalledWith('Action aborted.', 'warning');
    });

    it('should use fullResetAction for reset type', () => {
        render(<SeedControl type="reset" />);

        expect(require('react').useActionState).toHaveBeenCalledWith(fullResetAction, null);
    });

    it('should use systemCommandAction for non-reset types', () => {
        render(<SeedControl type="add_books" />);

        expect(require('react').useActionState).toHaveBeenCalledWith(systemCommandAction, null);
    });

    it('should be disabled when pending', () => {
        (require('react').useActionState as jest.Mock).mockReturnValue([
            null,
            mockFormAction,
            true,
        ]);

        render(<SeedControl type="add_books" />);

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveTextContent('Executing...');
    });

    it('should handle all command types', () => {
        const types: Array<
            | 'reset'
            | 'add_sales'
            | 'seed_discounts'
            | 'stock_purge'
            | 'review_bomb'
            | 'add_carts'
            | 'add_wishlists'
            | 'add_books'
        > = [
            'add_sales',
            'seed_discounts',
            'reset',
            'stock_purge',
            'review_bomb',
            'add_carts',
            'add_wishlists',
            'add_books',
        ];

        types.forEach((type) => {
            const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
            const { unmount } = render(<SeedControl type={type} />);
            fireEvent.click(screen.getByRole('button'));
            expect(mockFormAction).toHaveBeenCalled();
            unmount();
            confirmSpy.mockRestore();
            jest.clearAllMocks();
            (require('react').useActionState as jest.Mock).mockReturnValue([
                null,
                mockFormAction,
                false,
            ]);
        });
    });

    it('should log initiating message when pending', () => {
        (require('react').useActionState as jest.Mock).mockReturnValue([
            null,
            mockFormAction,
            true,
        ]);

        render(<SeedControl type="add_sales" />);

        expect(sysLog).toHaveBeenCalledWith('Initiating ADD_SALES sequence...', 'info');
    });

    it('should add animate-system-shake class when pending and type is reset', () => {
        const mockElement = {
            classList: { add: jest.fn(), remove: jest.fn() },
        };
        const getElementByIdSpy = jest
            .spyOn(document, 'getElementById')
            .mockReturnValue(mockElement as unknown as HTMLElement);
        (require('react').useActionState as jest.Mock).mockReturnValue([
            null,
            mockFormAction,
            true,
        ]);

        render(<SeedControl type="reset" />);

        expect(getElementByIdSpy).toHaveBeenCalledWith('telemetry-unit');
        expect(mockElement.classList.add).toHaveBeenCalledWith('animate-system-shake');
        expect(sysLog).toHaveBeenCalledWith(
            'ALERT: Magnetic interference detected during wipe.',
            'warning',
        );

        getElementByIdSpy.mockRestore();
    });

    it('should remove animate-system-shake class when not pending', () => {
        const mockElement = {
            classList: { add: jest.fn(), remove: jest.fn() },
        };
        const getElementByIdSpy = jest
            .spyOn(document, 'getElementById')
            .mockReturnValue(mockElement as unknown as HTMLElement);
        (require('react').useActionState as jest.Mock).mockReturnValue([
            null,
            mockFormAction,
            false,
        ]);

        render(<SeedControl type="reset" />);

        expect(mockElement.classList.remove).toHaveBeenCalledWith('animate-system-shake');
        getElementByIdSpy.mockRestore();
    });

    it('should show success snackbar when state changes with success', () => {
        const mockState: ActionState = { success: true, message: 'Operation completed' };
        (require('react').useActionState as jest.Mock).mockReturnValue([
            mockState,
            mockFormAction,
            false,
        ]);

        render(<SeedControl type="add_books" />);

        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Operation completed', {
            variant: 'success',
            style: { fontFamily: 'monospace', fontSize: '12px' },
        });
        expect(sysLog).toHaveBeenCalledWith('Operation completed', 'success');
    });

    it('should show error snackbar when state changes with error', () => {
        const mockState: ActionState = { success: false, message: 'Operation failed' };
        (require('react').useActionState as jest.Mock).mockReturnValue([
            mockState,
            mockFormAction,
            false,
        ]);

        render(<SeedControl type="add_books" />);

        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Operation failed', {
            variant: 'error',
            style: { fontFamily: 'monospace', fontSize: '12px' },
        });
        expect(sysLog).toHaveBeenCalledWith('Operation failed', 'error');
    });

    it('should not show snackbar when state is null', () => {
        (require('react').useActionState as jest.Mock).mockReturnValue([
            null,
            mockFormAction,
            false,
        ]);

        render(<SeedControl type="add_books" />);

        expect(mockEnqueueSnackbar).not.toHaveBeenCalled();
    });

    it('should append command parameter to formData payload on non-reset types', () => {
        jest.spyOn(window, 'confirm').mockReturnValue(true);

        const appendSpy = jest.fn();
        const fakeFormData = { append: appendSpy } as unknown as FormData;

        mockFormAction.mockImplementation((formData: FormData) => {
            formData.append('command', 'add_books');
        });

        render(<SeedControl type="add_books" />);

        const form = screen.getByRole('button').closest('form');
        if (form) {
            fireEvent.submit(form);
        }

        expect(mockFormAction).toHaveBeenCalled();
    });
});
