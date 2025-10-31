import { render } from '@testing-library/react';
import { Genre, handleGenreChoice } from '../../../components/layout/FilterBar/Genre';

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
	CustomPopoverWithList: jest.fn(({ genres, message }) => {
		return (
			<div data-testid='mock-dropdown-list'>
				{genres && <p>Genre: {genres.join(', ')}</p>}
				{message && <p>Message: {message}</p>}
			</div>
		);
	}),
}));

jest.mock('next/navigation', () => ({
	redirect: jest.fn(),
}));

describe('FilterBar - Genre', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should render the Popover with a message when there is a database error', async () => {
		const mockResponse = { data: null, error: { message: 'DB Error' } };
		mockSelect.mockResolvedValueOnce(mockResponse);

		render(await Genre());

		const MockedPopover =
			require('../../../components/CustomPopoverWithList').CustomPopoverWithList;

		expect(MockedPopover).toHaveBeenCalledWith(
			expect.objectContaining({
				btnText: 'Genre',
				btnIcon: undefined,
				listToRender: expect.arrayContaining([]),
				listIcons: undefined,
				message: 'Failed to retrieve books from database.',
				listItemOnClick: expect.any(Function),
			}),
			undefined,
		);
	});

	it('should render the Popover with a message when no genres are found', async () => {
		const mockResponse = { data: [], error: null };
		mockSelect.mockResolvedValueOnce(mockResponse);

		render(await Genre());

		const MockedPopover =
			require('../../../components/CustomPopoverWithList').CustomPopoverWithList;

		expect(MockedPopover).toHaveBeenCalledWith(
			expect.objectContaining({
				btnText: 'Genre',
				btnIcon: undefined,
				listToRender: expect.arrayContaining([]),
				listIcons: undefined,
				message: 'No book genres found.',
				listItemOnClick: expect.any(Function),
			}),
			undefined,
		);
	});

	it('should render the Popover component with fetched genres on success', async () => {
		const mockData = [{ genre: 'Comic' }, { genre: 'Drama' }, { genre: 'Fantasy' }];
		const mockResponse = { data: mockData, error: null };
		mockSelect.mockResolvedValueOnce(mockResponse);

		const { getByTestId } = render(await Genre());

		const dropdownList = getByTestId('mock-dropdown-list');
		expect(dropdownList).toBeInTheDocument();

		const MockedPopover =
			require('../../../components/CustomPopoverWithList').CustomPopoverWithList;

		expect(MockedPopover).toHaveBeenCalledWith(
			expect.objectContaining({
				btnText: 'Genre',
				btnIcon: undefined,
				listToRender: expect.arrayContaining(['Comic', 'Drama', 'Fantasy']),
				listIcons: undefined,
				message: undefined,
				listItemOnClick: expect.any(Function),
			}),
			undefined,
		);
	});

	it('should handle thrown errors and pass a message to the DropdownList', async () => {
		mockSelect.mockRejectedValueOnce(new Error('Network error'));

		render(await Genre());

		const MockedDropdownList =
			require('../../../components/CustomPopoverWithList').CustomPopoverWithList;

		expect(MockedDropdownList).toHaveBeenCalledWith(
			expect.objectContaining({
				btnText: 'Genre',
				btnIcon: undefined,
				listToRender: expect.arrayContaining([]),
				message: 'Failed to retrieve books from database.',
				listIcons: undefined,
				listItemOnClick: expect.any(Function),
			}),
			undefined,
		);
	});

	it('should redirect to the correct URL when handleGenreChoice is called', async () => {
		const { redirect } = require('next/navigation');
		const filter = 'Drama';
		const expectedUrl = '/books/genre/Drama';

		await handleGenreChoice(filter);

		expect(redirect).toHaveBeenCalledWith(expectedUrl);
	});
});
