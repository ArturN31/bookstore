import { RootLayout } from '@/components/layout/Layout';

export default function PrivacyPolicy() {
	return (
		<RootLayout>
			<div className='grid gap-3'>
				<h1 className='font-bold'>This is a sample Privacy Policy generated for the purposes of this project.</h1>

				<p>
					<span className='font-semibold'>Effective Date:</span> [Insert Date]
				</p>

				<p>
					This Privacy Policy explains how Books 4 You ("we," "us," or "our") collects, uses, and discloses information
					about you when you visit our website, use our mobile applications (if applicable), or interact with us through
					other means (e.g., email, phone).
				</p>

				<h2 className='font-bold'>1. Information We Collect</h2>

				<h3 className='font-bold'>Information You Provide:</h3>
				<ul>
					<li>
						<span className='font-semibold'>Account Information:</span> When you create an account, we may collect your
						name, email address, phone number, shipping address, and billing information.
					</li>
					<li>
						<span className='font-semibold'>Order Information:</span> We collect information about your orders, such as
						the books you purchase, your order history, and payment information.
					</li>
					<li>
						<span className='font-semibold'>Contact Information:</span> When you contact us with inquiries or support
						requests, we may collect your name, email address, phone number, and the content of your communications.
					</li>
					<li>
						<span className='font-semibold'>Reviews and Feedback:</span> If you choose to submit reviews or feedback, we
						may collect your name (or username) and the content of your submissions.
					</li>
				</ul>

				<h3 className='font-bold'>Information Automatically Collected:</h3>
				<ul>
					<li>
						<span className='font-semibold'>Log Files:</span> We may automatically collect certain information when you
						visit our website, such as your IP address, browser type, operating system, referring URLs, and browsing
						activity on our website.
					</li>
					<li>
						<span className='font-semibold'>Cookies and Similar Technologies:</span> We may use cookies, web beacons,
						and other similar technologies to collect information about your browsing behavior, preferences, and device
						information. You can control the use of cookies through your browser settings.
					</li>
				</ul>

				<h2 className='font-bold'>2. How We Use Your Information</h2>
				<ul>
					<li>
						<span className='font-semibold'>Fulfill Orders:</span> We use your information to process and fulfill your
						orders, including shipping and billing.
					</li>
					<li>
						<span className='font-semibold'>Provide Customer Support:</span> We use your information to respond to your
						inquiries and provide customer support.
					</li>
					<li>
						<span className='font-semibold'>Communicate with You:</span> We may use your information to send you order
						confirmations, shipping updates, promotional offers, and other communications related to our services.
					</li>
					<li>
						<span className='font-semibold'>Improve Our Services:</span> We use your information to analyze website
						traffic, understand customer behavior, and improve our website and services.
					</li>
					<li>
						<span className='font-semibold'>Personalize Your Experience:</span> We may use your information to
						personalize your experience on our website, such as by recommending books based on your past purchases.
					</li>
					<li>
						<span className='font-semibold'>Comply with Legal Obligations:</span> We may use your information to comply
						with applicable laws and regulations.
					</li>
				</ul>

				<h2 className='font-bold'>3. Information Sharing</h2>
				<ul>
					<li>
						<span className='font-semibold'>Third-Party Service Providers:</span> We may share your information with
						third-party service providers who assist us with our business operations, such as payment processors,
						shipping carriers, and marketing platforms. These third parties are obligated to use your information only
						for the purposes for which it was provided.
					</li>
					<li>
						<span className='font-semibold'>Business Transfers:</span> If we are involved in a merger, acquisition, or
						sale of assets, your information may be transferred to the acquiring entity.
					</li>
					<li>
						<span className='font-semibold'>Legal Compliance:</span> We may disclose your information to law enforcement
						or other authorities if required by law or in response to a valid legal request.
					</li>
				</ul>

				<h2 className='font-bold'>4. Data Security</h2>
				<p>
					We take reasonable measures to protect your information from unauthorized access, use, and disclosure.
					However, no method of transmission over the internet or method of electronic storage is completely secure.
				</p>

				<h2 className='font-bold'>5. Your Rights</h2>
				<ul>
					<li>
						<span className='font-semibold'>Access and Correction:</span> You may have the right to access and correct
						the information we hold about you.
					</li>
					<li>
						<span className='font-semibold'>Data Portability:</span> You may have the right to receive your personal
						data in a portable format.
					</li>
					<li>
						<span className='font-semibold'>Data Erasure:</span> You may have the right to request the deletion of your
						personal data under certain circumstances.
					</li>
					<li>
						<span className='font-semibold'>Object to Processing:</span> You may have the right to object to the
						processing of your personal data in certain circumstances.
					</li>
					<li>
						<span className='font-semibold'>Withdraw Consent:</span> If you have consented to the processing of your
						personal data, you have the right to withdraw your consent at any time.
					</li>
				</ul>

				<h2 className='font-bold'>6. Children's Privacy</h2>
				<p>
					Our website is not intended for children under the age of 13. We do not knowingly collect personal information
					from children under 13.
				</p>

				<h2 className='font-bold'>7. Changes to this Privacy Policy</h2>
				<p>
					We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the
					updated policy on our website.
				</p>

				<h2 className='font-bold'>8. Contact Us</h2>
				<p>If you have any questions about this Privacy Policy, please contact us at [email protected]</p>
			</div>
		</RootLayout>
	);
}
