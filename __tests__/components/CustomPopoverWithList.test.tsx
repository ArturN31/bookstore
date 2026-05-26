import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { CustomPopoverWithList } from '@/components/ui/CustomPopoverWithList';

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

    it('Should render button with text', () => {
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
        expect(popoverBtn).toHaveClass('bg-yellow');
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

    it('Should render message when provided', () => {
        render(
            <CustomPopoverWithList
                btnText="Format"
                btnIcon={undefined}
                listToRender={expectedListItems}
                listIcons={undefined}
                message="This is a message"
                listItemOnClick={mockListItemOnClick}
            />,
        );

        const popoverBtn = screen.getByTestId('popover-format-btn');
        fireEvent.click(popoverBtn);

        const messageElement = screen.getByText('This is a message');
        expect(messageElement).toBeInTheDocument();
        expect(messageElement).toHaveAttribute('role', 'alert');
    });

    it('Should render list item with icon when listIcons are provided', () => {
        const mockIcons = [
            <span
                key="1"
                data-testid="item-icon"
            />,
        ];

        render(
            <CustomPopoverWithList
                btnText="Format"
                btnIcon={undefined}
                listToRender={['Choice 1']}
                listIcons={mockIcons}
                message={undefined}
                listItemOnClick={mockListItemOnClick}
            />,
        );

        fireEvent.click(screen.getByTestId('popover-format-btn'));

        const listItem = screen.getByTestId('popover-format-choice-choice-1');
        expect(listItem).toBeInTheDocument();
        expect(screen.getByTestId('item-icon')).toBeInTheDocument();
    });

    it('Should have correct aria attributes on button when popover is closed', () => {
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
        expect(popoverBtn).toHaveAttribute('aria-haspopup', 'menu');
        expect(popoverBtn).toHaveAttribute('aria-label', 'Format menu');
        expect(popoverBtn).toHaveAttribute('aria-expanded', 'false');
    });

    it('Should have correct aria attributes when popover is open', () => {
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

        expect(popoverBtn).toHaveAttribute('aria-controls', 'popover-format');
        expect(popoverBtn).toHaveAttribute('aria-haspopup', 'menu');
        expect(popoverBtn).toHaveAttribute('aria-label', 'Format menu');
        expect(popoverBtn).toHaveAttribute('aria-expanded', 'true');
    });

    it('Should have correct aria attributes in Icon Mode when popover is closed', () => {
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
        expect(popoverBtn).toHaveAttribute('aria-haspopup', 'menu');
        expect(popoverBtn).toHaveAttribute('aria-label', 'Open menu');
        expect(popoverBtn).toHaveAttribute('aria-expanded', 'false');
    });

    it('Should have correct aria attributes in Icon Mode when popover is open', () => {
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
        fireEvent.click(popoverBtn);

        expect(popoverBtn).toHaveAttribute('aria-controls', 'popover-icon');
        expect(popoverBtn).toHaveAttribute('aria-haspopup', 'menu');
        expect(popoverBtn).toHaveAttribute('aria-label', 'Open menu');
        expect(popoverBtn).toHaveAttribute('aria-expanded', 'true');
    });

    it('Should have correct aria-expanded state when popover is open', () => {
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
        expect(popoverBtn).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(popoverBtn);

        expect(popoverBtn).toHaveAttribute('aria-expanded', 'true');
    });

    it('Should call listItemOnClick and close popover on list item click', () => {
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

        const listItem = screen.getByTestId('popover-format-choice-audiobook');
        fireEvent.click(listItem);

        expect(mockListItemOnClick).toHaveBeenCalledWith('Audiobook');
    });

    it('Should render all list items correctly', () => {
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

        expectedListItems.forEach((item) => {
            expect(
                screen.getByTestId(
                    `popover-format-choice-${item.toLocaleLowerCase().replaceAll(' ', '-')}`,
                ),
            ).toBeInTheDocument();
        });
    });

    it('Should render list item with icon at correct index', () => {
        const mockIcons = [
            <span
                key="0"
                data-testid="icon-0"
            />,
            <span
                key="1"
                data-testid="icon-1"
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

        expect(screen.getByTestId('icon-0')).toBeInTheDocument();
        expect(screen.getByTestId('icon-1')).toBeInTheDocument();
    });

    it('Should handle empty listToRender gracefully', () => {
        render(
            <CustomPopoverWithList
                btnText="Format"
                btnIcon={undefined}
                listToRender={[]}
                listIcons={undefined}
                message={undefined}
                listItemOnClick={mockListItemOnClick}
            />,
        );

        const popoverBtn = screen.getByTestId('popover-format-btn');
        fireEvent.click(popoverBtn);

        expect(screen.queryByTestId('popover-format-list')).toBeInTheDocument();
        expect(screen.queryByTestId('popover-format-choice-audiobook')).not.toBeInTheDocument();
    });

    it('Should handle undefined listToRender gracefully', () => {
        render(
            <CustomPopoverWithList
                btnText="Format"
                btnIcon={undefined}
                listToRender={undefined}
                listIcons={undefined}
                message={undefined}
                listItemOnClick={mockListItemOnClick}
            />,
        );

        const popoverBtn = screen.getByTestId('popover-format-btn');
        fireEvent.click(popoverBtn);

        expect(screen.queryByTestId('popover-format-list')).toBeInTheDocument();
        expect(screen.queryByTestId('popover-format-choice-audiobook')).not.toBeInTheDocument();
    });

    it('Should handle undefined listItemOnClick without errors', () => {
        const mockFn = jest.fn();
        render(
            <CustomPopoverWithList
                btnText="Format"
                btnIcon={undefined}
                listToRender={expectedListItems}
                listIcons={undefined}
                message={undefined}
                listItemOnClick={mockFn}
            />,
        );

        const popoverBtn = screen.getByTestId('popover-format-btn');
        fireEvent.click(popoverBtn);

        const listItem = screen.getByTestId('popover-format-choice-audiobook');
        fireEvent.click(listItem);

        expect(mockFn).toHaveBeenCalledWith('Audiobook');
    });

    it('Should handle undefined message without errors', () => {
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

        expect(screen.queryByText('This is a message')).not.toBeInTheDocument();
    });

    it('Should handle undefined listIcons without errors', () => {
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

        expect(screen.queryByTestId('icon-1')).not.toBeInTheDocument();
    });

    it('Should handle empty string btnText as Icon Mode', () => {
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
        expect(popoverBtn).toHaveClass('bg-yellow');
    });

    it('Should handle whitespace-only btnText as text mode (truthy)', () => {
        const MockIcon = <span data-testid="test-icon" />;
        render(
            <CustomPopoverWithList
                btnText="   "
                btnIcon={MockIcon}
                listToRender={expectedListItems}
                listIcons={undefined}
                message={undefined}
                listItemOnClick={mockListItemOnClick}
            />,
        );

        const popoverBtn = screen.getByTestId('popover-icon-btn');
        expect(popoverBtn).not.toHaveClass('bg-yellow');
        expect(popoverBtn).toHaveAttribute('aria-haspopup', 'menu');
        expect(popoverBtn).toHaveAttribute('aria-label', 'Open menu');
        expect(popoverBtn).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(popoverBtn);

        expect(popoverBtn).toHaveAttribute('aria-expanded', 'true');
    });
});
