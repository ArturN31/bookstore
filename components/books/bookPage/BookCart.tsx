export const BookCart = ({ price }: { price: string }) => {
	const SelectOptions = () => {
		const rows = [];
		for (let i = 0; i <= 10; i++) {
			rows.push(<option>{i}</option>);
		}
		return rows;
	};

	return (
		<div className='sm:col-span-2 md:col-span-1 grid gap-2 text-center border p-5 items-center'>
			<p>Price: {price}</p>

			<select>
				<SelectOptions />
			</select>

			<button>Add to Cart</button>
			<hr />
			<p>Sent in 24h</p>
			<hr />
			<p>Delivery to the bookstore &#163;0</p>
		</div>
	);
};
