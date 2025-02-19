export const BookSecondaryDetails = ({
	publicationDate,
	pageCount,
	format,
	publisher,
	author,
	title,
}: {
	publicationDate: string;
	pageCount: number;
	format: string;
	publisher: string;
	author: string;
	title: string;
}) => {
	return (
		<div>
			<p className='text-lg font-semibold'>Details</p>

			<table className='table-auto'>
				<tbody>
					{[
						{ text: 'Publication date:', value: publicationDate },
						{ text: 'Page count:', value: pageCount },
						{ text: 'Format:', value: format },
						{ text: 'Publisher:', value: publisher },
						{ text: 'Author:', value: author },
						{ text: 'Title:', value: title },
					].map((el) => (
						<tr
							className='grid grid-cols-2 gap-10'
							key={el.text}>
							<td>{el.text}</td>
							<td>{el.value}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
