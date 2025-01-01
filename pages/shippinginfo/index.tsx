import { RootLayout } from '@/components/layout/Layout';

export default function ShippingInformation() {
	return (
		<RootLayout>
			<div className='grid gap-3'>
				<h1 className='font-bold'>This is a sample Shipping Information generated for the purposes of this project.</h1>

				<h2 className='font-bold'>Shipping Methods</h2>
				<ul>
					<li>
						<span className='font-semibold'>Standard Shipping:</span>
						<ul>
							<li>Estimated delivery: 2-5 business days</li>
							<li>Shipping cost: Based on the weight of the parcel (&#163;4.50 - &#163;20) within United Kingdom.</li>
						</ul>
					</li>
				</ul>

				<h2 className='font-bold'>Shipping Destinations</h2>
				<p>We currently ship within United Kingdom.</p>

				<h2 className='font-bold'>Order Processing Time</h2>
				<p>Orders are typically processed within 1-3 business days.</p>

				<h2 className='font-bold'>Tracking Your Order</h2>
				<p>Once your order has shipped, you will receive an email with your tracking information.</p>

				<h2 className='font-bold'>Contact Us</h2>
				<p>
					If you have any questions about shipping, please contact us at{' '}
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
