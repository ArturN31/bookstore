import { Format } from './Format';
import { Genre } from './Genre';
import { Home } from './Home';
import { SortBy } from './SortBy';

export const FilterBar = () => {
	return (
		<nav
			className='sticky top-0 z-10 bg-gray-100 border-b border-gray-200'
			data-testid='filterbar'
			aria-label='Product Filters and Sorting Options'>
			<div className='container mx-auto px-4'>
				<div
					className='flex items-center justify-start overflow-x-auto -mb-px'
					role='menubar'>
					<div
						className='shrink-0 bg-transparent text-gray-700 hover:text-blue-600 py-2 px-4 focus:outline-none'
						data-testid='filterbar-home'>
						<Home />
					</div>
					<div
						className='shrink-0 bg-transparent text-gray-700 hover:text-blue-600 py-2 px-4 focus:outline-none'
						data-testid='filterbar-genre'>
						<Genre />
					</div>
					<div
						className='shrink-0 bg-transparent text-gray-700 hover:text-blue-600 py-2 px-4 focus:outline-none'
						data-testid='filterbar-format'>
						<Format />
					</div>
					<div
						className='shrink-0 bg-transparent text-gray-700 hover:text-blue-600 py-2 px-4 focus:outline-none'
						data-testid='filterbar-sortby'>
						<SortBy />
					</div>
				</div>
			</div>
		</nav>
	);
};
