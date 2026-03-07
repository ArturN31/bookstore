import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { CustomPopoverWithList } from '@/components/CustomPopoverWithList';

const expectedListItems = ['Audiobook', 'Ebook', 'Hardcover', 'Paperback'];
const mockListItemOnClick = jest.fn();

describe('Custom Popover With List', () => {
    let consoleSpy: jest.SpyInstance;

    beforeAll(() => {
        Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({
                width: 120,
                height: 40,
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                x: 0,
                y: 0,
                toJSON: () => {},
            }),
        });

        consoleSpy = jest.spyOn(console, 'warn').mockImplementation((msg) => {
            if (msg.includes('MUI: The `anchorEl` prop provided to the component is invalid'))
                return;
            console.warn(msg);
        });
    });

    afterAll(() => {
        consoleSpy.mockRestore();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Should render button', () => {
        render(
            <CustomPopoverWithList
                btnText="Format"
                btnIcon={undefined}
                listToRender={expectedListItems}
                listIcons={undefined}
                message={undefined}
                listItemOnClick={mockListItemOnClick}
            />,
        );

        const popoverBtn = screen.getByTestId('popover-format-btn');
        expect(popoverBtn).toHaveTextContent('Format');
    });

    it('Should render popover on button click', () => {
        render(
            <CustomPopoverWithList
                btnText="Format"
                btnIcon={undefined}
                listToRender={expectedListItems}
                listIcons={undefined}
                message={undefined}
                listItemOnClick={mockListItemOnClick}
            />,
        );

        const popoverBtn = screen.getByTestId('popover-format-btn');
        fireEvent.click(popoverBtn);

        const popover = screen.getByTestId('popover-format-list');
        expect(popover).toBeInTheDocument();
        expect(popover).toHaveTextContent(expectedListItems[0]);
    });

    it('Should close popover on body click', async () => {
        render(
            <CustomPopoverWithList
                btnText="Format"
                btnIcon={undefined}
                listToRender={expectedListItems}
                listIcons={undefined}
                message={undefined}
                listItemOnClick={mockListItemOnClick}
            />,
        );

        const popoverBtn = screen.getByTestId('popover-format-btn');
        fireEvent.click(popoverBtn);

        const popover = screen.getByTestId('popover-format-list');
        expect(popover).toBeInTheDocument();

        const backdrop = document.querySelector('.MuiBackdrop-invisible');
        if (backdrop) {
            fireEvent.click(backdrop);
        } else {
            fireEvent.click(document.body);
        }

        await waitFor(() => {
            expect(popover).not.toBeVisible();
        });
    });

    it('Should handle list item click', () => {
        render(
            <CustomPopoverWithList
                btnText="Format"
                btnIcon={undefined}
                listToRender={expectedListItems}
                listIcons={undefined}
                message={undefined}
                listItemOnClick={mockListItemOnClick}
            />,
        );

        const popoverBtn = screen.getByTestId('popover-format-btn');
        fireEvent.click(popoverBtn);

        const listItemAudiobook = screen.getByTestId('popover-format-choice-audiobook');
        fireEvent.click(listItemAudiobook);

        expect(mockListItemOnClick).toHaveBeenCalledWith('Audiobook');
    });

    it('Should render in Icon Mode when btnText is missing', () => {
        const MockIcon = <span data-testid="test-icon" />;
        render(
            <CustomPopoverWithList
                btnText=""
                btnIcon={MockIcon}
                listToRender={expectedListItems}
                listIcons={undefined}
                message={undefined}
                listItemOnClick={mockListItemOnClick}
            />,
        );

        const popoverBtn = screen.getByTestId('popover-icon-btn');
        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
        expect(popoverBtn).toHaveStyle({ backgroundColor: '#f7cb15' });
    });

    it('Should render endIcons in the list when listIcons are provided', () => {
        const mockIcons = [
            <span
                key="1"
                data-testid="icon-1"
            />,
            <span
                key="2"
                data-testid="icon-2"
            />,
        ];

        render(
            <CustomPopoverWithList
                btnText="Format"
                btnIcon={undefined}
                listToRender={['Choice 1', 'Choice 2']}
                listIcons={mockIcons}
                message={undefined}
                listItemOnClick={mockListItemOnClick}
            />,
        );

        fireEvent.click(screen.getByTestId('popover-format-btn'));

        expect(screen.getByTestId('icon-1')).toBeInTheDocument();
        expect(screen.getByTestId('icon-2')).toBeInTheDocument();
    });
});
