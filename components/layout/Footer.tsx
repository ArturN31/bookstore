import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from 'lucide-react';
import Link from 'next/link';

export const Footer = () => {
	return (
		<div className='flex bg-gunmetal text-white p-8'>
			<div className='grid gap-5 m-auto'>
				<p className='grid items-center text-center max-w-[500px]'>
					We want to provide readers with a convenient and affordable way to access a vast library of digital books. We
					strive to offer a diverse selection of genres, exclusive titles, and exceptional customer service, ensuring a
					seamless and enjoyable reading experience for all.
				</p>

				<div className='grid grid-flow-col auto-cols-auto gap-5'>
					<div className='grid items-center'>
						<ul className='grid gap-2'>
							<li className='flex items-center gap-5'>
								<MapPin />
								<div>
									<p>West Highland Way, Milngavie</p>
									<p>Glasgow, G62 6PB</p>
								</div>
							</li>
							<li className='flex items-center gap-5'>
								<Phone />
								<p>+44 7911 123456</p>
							</li>
							<li className='flex items-center gap-5'>
								<Mail />
								<a
									href='mailto:books4you.contact@b4u.com'
									className='text-sky-500 hover:text-sky-700'>
									books4you.contact@example.com
								</a>
							</li>
						</ul>
					</div>

					<div className='grid gap-3 text-center'>
						<ul>
							<li>
								<a
									href='/privacypolicy'
									className='text-sky-500 hover:text-sky-700'>
									Privacy Policy
								</a>
							</li>
							<li>
								<a
									href='/tos'
									className='text-sky-500 hover:text-sky-700'>
									Terms of Service
								</a>
							</li>
							<li>
								<a
									href='/shippinginfo'
									className='text-sky-500 hover:text-sky-700'>
									Shipping Information
								</a>
							</li>
							<li>
								<a
									href='/returnpolicy'
									className='text-sky-500 hover:text-sky-700'>
									Return Policy
								</a>
							</li>
						</ul>

						<div className='flex justify-center gap-2 items-center'>
							<Link
								href='https://www.linkedin.com/'
								target='_blank'>
								<Linkedin />
							</Link>
							<Link
								href='https://www.facebook.com/'
								target='_blank'>
								<Facebook />
							</Link>
							<Link
								href='https://www.instagram.com/'
								target='_blank'>
								<Instagram />
							</Link>
							<Link
								className='px-1'
								href='https://x.com/'
								target='_blank'>
								<Twitter />
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
