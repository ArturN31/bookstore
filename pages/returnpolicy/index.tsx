import { RootLayout } from '@/components/layout/Layout';

export default function ReturnPolicy() {
	return (
		<RootLayout>
			<div className='grid gap-3'>
				<h1 className='font-bold'>This is a sample Return Policy generated for the purposes of this project.</h1>

				<p>
					We want you to be completely satisfied with your purchase. If for any reason you are not satisfied with your
					order, you may return it within 30 days of the original purchase date for a full refund or exchange.
				</p>

				<h2 className='font-bold'>Eligibility for Return</h2>
				<ul>
					<li>The item must be in its original condition, unused, and in the original packaging.</li>
					<li>The item must not be marked down or on sale.</li>
					<li>
						Certain items may not be eligible for return, such as [List of ineligible items, e.g., digital downloads,
						personalized items].
					</li>
				</ul>

				<h2 className='font-bold'>Initiating a Return</h2>
				<ol>
					<li>
						Contact us at{' '}
						<a
							href='mailto:books4you.contact@b4u.com'
							className='text-sky-500 hover:text-sky-700'>
							books4you.contact@example.com
						</a>{' '}
						or +44 7911 123456 within 7 days of receiving your order to request a return authorization.
					</li>
					<li>Include your order number and the reason for your return in your request.</li>
					<li>
						We will provide you with a Return Merchandise Authorization (RMA) number and instructions for returning the
						item.
					</li>
				</ol>

				<h2 className='font-bold'>Shipping Costs</h2>
				<ul>
					<li>
						<span className='font-semibold'>Return Shipping Costs:</span> You are responsible for the cost of return
						shipping unless the return is due to our error (e.g., incorrect item shipped, damaged item).
					</li>
					<li>
						<span className='font-semibold'>Original Shipping Costs:</span> Original shipping costs are non-refundable
						unless the return is due to our error.
					</li>
				</ul>

				<h2 className='font-bold'>Refunds</h2>
				<ul>
					<li>
						Once we receive your returned item and verify that it meets the return eligibility requirements, we will
						issue a refund to your original payment method within 5 business days.
					</li>
					<li>Refunds for credit card payments may take 5 business days to appear on your statement.</li>
				</ul>

				<h2 className='font-bold'>Exchanges</h2>
				<p>
					If you would like to exchange an item, please contact us to arrange a return and a new order for the desired
					item.
				</p>

				<h2 className='font-bold'>Contact Us</h2>
				<p>
					If you have any questions about our Return Policy, please contact us at{' '}
					<a
						href='mailto:books4you.contact@b4u.com'
						className='text-sky-500 hover:text-sky-700'>
						books4you.contact@example.com
					</a>{' '}
					or +44 7911 123456.
				</p>
			</div>
		</RootLayout>
	);
}
