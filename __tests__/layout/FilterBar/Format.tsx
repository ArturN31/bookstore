import { render } from '@testing-library/react';
import { Format, handleFormatChoice } from '../../../components/layout/FilterBar/Format';

const mockFrom = jest.fn();
const mockSelect = jest.fn();

jest.mock('../../../utils/db/server', () => ({
	createClient: jest.fn(() => ({
		from: mockFrom.mockReturnValue({
			select: mockSelect,
		}),
	})),
}));

jest.mock('../../../components/CustomPopoverWithList', () => ({
	CustomPopoverWithList: jest.fn(({ formats, message }) => {
		return (
			<div data-testid='mock-dropdown-list'>
				{formats && <p>Format: {formats.join(', ')}</p>}
				{message && <p>Message: {message}</p>}
			</div>
		);
	}),
}));

jest.mock('next/navigation', () => ({
	redirect: jest.fn(),
}));

describe('FilterBar - Format', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should render the Popover with a message when there is a database error', async () => {
		const mockResponse = {
			data: [],
			error: { message: 'DB Error' },
		};
		mockSelect.mockResolvedValueOnce(mockResponse);

		render(await Format());

		const MockedPopover =
			require('../../../components/CustomPopoverWithList').CustomPopoverWithList;

		expect(MockedPopover).toHaveBeenCalledWith(
			expect.objectContaining({
				btnText: 'Format',
				btnIcon: undefined,
				listToRender: expect.arrayContaining([]),
				listIcons: undefined,
				message: 'Failed to retrieve books from database.',
				listItemOnClick: expect.any(Function),
			}),
			undefined,
		);
	});

	it('should render the Popover with a message when no formats are found', async () => {
		const mockResponse = {
			data: [],
			error: null,
		};
		mockSelect.mockResolvedValueOnce(mockResponse);

		render(await Format());

		const MockedDropdownList =
			require('../../../components/CustomPopoverWithList').CustomPopoverWithList;

		expect(MockedDropdownList).toHaveBeenCalledWith(
			expect.objectContaining({
				btnText: 'Format',
				btnIcon: undefined,
				listToRender: expect.arrayContaining([]),
				listIcons: undefined,
				message: 'No book formats found.',
				listItemOnClick: expect.any(Function),
			}),
			undefined,
		);
	});

	it('should render the Popover component with fetched formats on success', async () => {
		const mockData = [
			{ format: 'Paperback' },
			{ format: 'Hardcover' },
			{ format: 'Ebook' },
		];
		const mockResponse = { data: mockData, error: null };
		mockSelect.mockResolvedValueOnce(mockResponse);

		const { getByTestId } = render(await Format());

		const dropdownList = getByTestId('mock-dropdown-list');
		expect(dropdownList).toBeInTheDocument();

		const MockedDropdownList =
			require('../../../components/CustomPopoverWithList').CustomPopoverWithList;

		expect(MockedDropdownList).toHaveBeenCalledWith(
			expect.objectContaining({
				btnText: 'Format',
				btnIcon: undefined,
				listToRender: expect.arrayContaining(['Ebook', 'Hardcover', 'Paperback']),
				listIcons: undefined,
				message: undefined,
				listItemOnClick: expect.any(Function),
			}),
			undefined,
		);
	});

	it('should handle thrown errors and pass a message to the Popover', async () => {
		mockSelect.mockRejectedValueOnce(new Error('Network error'));

		render(await Format());

		const MockedDropdownList =
			require('../../../components/CustomPopoverWithList').CustomPopoverWithList;

		expect(MockedDropdownList).toHaveBeenCalledWith(
			expect.objectContaining({
				btnText: 'Format',
				btnIcon: undefined,
				listToRender: expect.arrayContaining([]),
				listIcons: undefined,
				message: 'Failed to retrieve books from database.',
				listItemOnClick: expect.any(Function),
			}),
			undefined,
		);
	});

	it('should redirect to the correct URL when handleFormatChoice is called', async () => {
		const { redirect } = require('next/navigation');
		const filter = 'Audiobook';
		const expectedUrl = '/books/format/Audiobook';

		await handleFormatChoice(filter);

		expect(redirect).toHaveBeenCalledWith(expectedUrl);
	});
});
