import { RootLayout } from '@/components/layout/Layout';

export default function TOS() {
	return (
		<RootLayout>
			<div className='grid gap-2'>
				<h1 className='font-bold'>This is a sample Terms of Service generated for the purposes of this project.</h1>

				<p>
					<span className='font-semibold'>Effective Date:</span> [Insert Date]
				</p>

				<h2 className='font-bold'>1. Agreement to Terms</h2>
				<p>
					By accessing or using this website, Books 4 You (the "Website"), or any of our services (collectively, the
					"Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms,
					please do not use the Website or Services.
				</p>

				<h2 className='font-bold'>2. Use of the Website</h2>
				<h3 className='font-bold'>Eligibility:</h3>
				<p>You must be at least 18 years old to use the Website and Services.</p>

				<h3 className='font-bold'>Account Registration:</h3>
				<p>
					If you choose to create an account on the Website, you are responsible for maintaining the confidentiality of
					your account information and for restricting access to your computer. You agree to accept responsibility for
					all activities that occur under your account.
				</p>

				<h3 className='font-bold'>Prohibited Conduct:</h3>
				<p className='font-semibold'>You agree not to:</p>
				<ul>
					<li className='list-disc ml-5'>Use the Website or Services for any unlawful purpose.</li>
					<li className='list-disc ml-5'>
						Use the Website or Services to transmit any viruses, worms, defects, or other items of a destructive nature.
					</li>
					<li className='list-disc ml-5'>
						Interfere with the security or proper functioning of the Website or Services.
					</li>
					<li className='list-disc ml-5'>
						Impersonate any person or entity or falsely claim an affiliation with any person or entity.
					</li>
					<li className='list-disc ml-5'>Collect or use any personal information about other users of the Website.</li>
					<li className='list-disc ml-5'>
						Use any automated means, including scripts, robots, crawlers, or data mining tools, to access, collect, or
						use information from the Website.
					</li>
				</ul>

				<h2 className='font-bold'>3. Product Information</h2>
				<p>
					<span className='font-semibold'>Accuracy:</span> We strive to provide accurate and up-to-date information
					about our products on the Website. However, we do not guarantee the accuracy, completeness, or reliability of
					any product information.
				</p>
				<p>
					<span className='font-semibold'>Availability:</span> Product availability may change without notice. We
					reserve the right to limit or cancel orders due to product availability or other reasons.
				</p>

				<h2 className='font-bold'>4. Ordering and Payment</h2>
				<p>
					<span className='font-semibold'>Order Acceptance:</span> All orders are subject to acceptance by us. We may,
					in our sole discretion, refuse or cancel any order for any reason.
				</p>
				<p>
					<span className='font-semibold'>Payment:</span> You agree to pay all charges incurred by you or any users of
					your account at the rates in effect when the charges are incurred. We accept various payment methods, as
					indicated on the Website.
				</p>
				<p>
					<span className='font-semibold'>Taxes:</span> You are responsible for any applicable taxes, including sales
					tax, on your orders.
				</p>

				<h2 className='font-bold'>5. Shipping and Delivery</h2>
				<p>
					<span className='font-semibold'>Shipping Costs:</span> Shipping costs are calculated based on the shipping
					method selected and the destination address.
				</p>
				<p>
					<span className='font-semibold'>Delivery Times:</span> Estimated delivery times are provided for your
					convenience and are not guaranteed.
				</p>
				<p>
					<span className='font-semibold'>Risk of Loss:</span> The risk of loss for products purchased from us passes to
					you upon delivery to the carrier.
				</p>

				<h2 className='font-bold'>6. Returns and Refunds</h2>
				<p>
					<span className='font-semibold'>Return Policy:</span> Please refer to our Return Policy for details on returns
					and refunds.
				</p>

				<h2 className='font-bold'>7. Intellectual Property</h2>
				<p>
					<span className='font-semibold'>Copyright:</span> All content on the Website, including text, images, logos,
					and trademarks, is protected by copyright and other intellectual property laws.
				</p>
				<p>
					<span className='font-semibold'>Trademarks:</span> The trademarks and logos displayed on the Website are the
					property of Books 4 You or their respective owners.
				</p>

				<h2 className='font-bold'>8. Disclaimer of Warranties</h2>
				<p>
					THE WEBSITE AND SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
					IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
					PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE WEBSITE OR SERVICES WILL BE UNINTERRUPTED OR
					ERROR-FREE.
				</p>

				<h2 className='font-bold'>9. Limitation of Liability</h2>
				<p>
					IN NO EVENT SHALL BOOKS 4 YOU BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
					PUNITIVE DAMAGES ARISING OUT OF OR RELATING TO THE USE OF THE WEBSITE OR SERVICES, INCLUDING, BUT NOT LIMITED
					TO, LOSS OF PROFITS, DATA LOSS, OR LOSS OF GOODWILL.
				</p>

				<h2 className='font-bold'>10. Indemnification</h2>
				<p>
					You agree to indemnify and hold Books 4 You and its affiliates, officers, directors, employees, and agents
					harmless from any and all claims, liabilities, damages, and expenses (including attorneys' fees) arising out
					of your use of the Website or Services, your violation of these Terms, or your violation of any rights of
					another.
				</p>

				<h2 className='font-bold'>11. Governing Law</h2>
				<p>These Terms shall be governed by and construed in accordance with the laws of United Kingdom.</p>

				<h2 className='font-bold'>12. Dispute Resolution</h2>
				<p>Any dispute arising out of or relating to these Terms shall be resolved through arbitration.</p>

				<h2 className='font-bold'>13. Changes to these Terms</h2>
				<p>
					We may update these Terms from time to time. We will notify you of any material changes by posting the updated
					Terms on the Website. Your continued use of the Website or Services after the effective date of any changes
					constitutes your acceptance of the revised Terms.
				</p>

				<h2 className='font-bold'>14. Contact Us</h2>
				<p>
					If you have any questions about these Terms, please contact us at{' '}
					<a
						href='mailto:books4you.contact@b4u.com'
						className='text-sky-500 hover:text-sky-700'>
						books4you.contact@example.com
					</a>
					.
				</p>
			</div>
		</RootLayout>
	);
}
