import { Format } from './format/Format';
import { Genre } from './genre/Genre';
import { Home } from './home';
import { SortBy } from './sort/SortBy';

export const FilterBar = () => {
	return (
		<div className='sticky top-0 z-10 bg-gray-100 border-b border-gray-200'>
			<div className='container mx-auto px-4'>
				<div className='flex items-center justify-start overflow-x-auto -mb-px'>
					<div className='shrink-0 bg-transparent text-gray-700 hover:text-blue-600 py-2 px-4 focus:outline-none'>
						<Home />
					</div>
					<div className='shrink-0 bg-transparent text-gray-700 hover:text-blue-600 py-2 px-4 focus:outline-none'>
						<Genre />
					</div>
					<div className='shrink-0 bg-transparent text-gray-700 hover:text-blue-600 py-2 px-4 focus:outline-none'>
						<Format />
					</div>
					<div className='shrink-0 bg-transparent text-gray-700 hover:text-blue-600 py-2 px-4 focus:outline-none'>
						<SortBy />
					</div>
				</div>
			</div>
		</div>
	);
};
