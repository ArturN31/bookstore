export const AddToCartCardForm = ({ cartID, bookID }: { cartID: string | null; bookID: string }) => {
	return (
		<form>
			<button className='border px-2 py-1 cursor-pointer'>Add to cart</button>
		</form>
	);
};
