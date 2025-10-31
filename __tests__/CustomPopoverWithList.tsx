import { render, waitFor } from '@testing-library/react';
import { fireEvent, screen } from '@testing-library/dom';
import { CustomPopoverWithList } from '../components/CustomPopoverWithList';

const expectedListItems = ['Audiobook', 'Ebook', 'Hardcover', 'Paperback'];
const mockListItemOnClick = jest.fn();

describe('Custom Popover With List', () => {
	it('Should render button', () => {
		render(
			<CustomPopoverWithList
				btnText='Format'
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
				btnText='Format'
				btnIcon={undefined}
				listToRender={expectedListItems}
				listIcons={undefined}
				message={undefined}
				listItemOnClick={mockListItemOnClick}
			/>,
		);

		const popoverBtn = screen.getByTestId('popover-format-btn');
		expect(popoverBtn).toHaveTextContent('Format');
		fireEvent.click(popoverBtn);

		const popover = screen.getByTestId('popover-format-list');
		expect(popover).toBeInTheDocument();
		expect(popover).toHaveTextContent(expectedListItems[0]);
	});

	it('Should close popover on body click', async () => {
		render(
			<CustomPopoverWithList
				btnText='Format'
				btnIcon={undefined}
				listToRender={expectedListItems}
				listIcons={undefined}
				message={undefined}
				listItemOnClick={mockListItemOnClick}
			/>,
		);

		const popoverBtn = screen.getByTestId('popover-format-btn');
		expect(popoverBtn).toHaveTextContent('Format');

		fireEvent.click(popoverBtn);

		const popover = screen.getByTestId('popover-format-list');
		expect(popover).toBeInTheDocument();

		const backdrop = document.querySelector('.MuiBackdrop-invisible');
		fireEvent.click(backdrop!);

		await waitFor(() => {
			expect(popover).not.toBeInTheDocument();
		});
	});

	it('Should handle list item click', () => {
		render(
			<CustomPopoverWithList
				btnText='Format'
				btnIcon={undefined}
				listToRender={expectedListItems}
				listIcons={undefined}
				message={undefined}
				listItemOnClick={mockListItemOnClick}
			/>,
		);

		const popoverBtn = screen.getByTestId('popover-format-btn');
		expect(popoverBtn).toHaveTextContent('Format');
		fireEvent.click(popoverBtn);

		const popover = screen.getByTestId('popover-format-list');
		expect(popover).toBeInTheDocument();

		const listItemAudiobook = screen.getByTestId('popover-format-choice-audiobook');
		fireEvent.click(listItemAudiobook);

		expect(mockListItemOnClick).toHaveBeenCalledWith('Audiobook');
	});
});
