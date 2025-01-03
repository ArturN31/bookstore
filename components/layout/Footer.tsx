import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import Link from 'next/link';

export const Footer = () => {
	return (
		<div className='flex bg-gunmetal text-white p-8'>
			<div className='grid gap-5 m-auto max-w-[850px]'>
				<div className='grid items-center text-center'>
					<p>
						We want to provide readers with a convenient and affordable way to access a vast library of digital books.
						We strive to offer a diverse selection of genres, exclusive titles, and exceptional customer service,
						ensuring a seamless and enjoyable reading experience for all.
					</p>
				</div>

				<div className='grid grid-flow-col auto-cols-fr gap-5'>
					<div className='grid items-center'>
						<ul className='grid gap-2 text-center'>
							{[
								<div>
									<p>West Highland Way, Milngavie</p>
									<p>Glasgow, G62 6PB</p>
								</div>,
								<p>+44 7911 123456</p>,
								<a
									href='mailto:books4you.contact@b4u.com'
									className='text-sky-500 hover:text-sky-700'>
									books4you.contact@example.com
								</a>,
							].map((content) => (
								<li className='grid items-center gap-5'>{content}</li>
							))}
						</ul>
					</div>

					<div className='grid gap-3 items-center text-center'>
						<ul>
							{[
								{ text: 'Return Policy', url: '/returnpolicy' },
								{ text: 'Privacy Policy', url: '/privacypolicy' },
								{ text: 'Terms of Service', url: '/tos' },
								{ text: 'Shipping Information', url: '/shippinginfo' },
							].map((content) => (
								<li>
									<a
										href={content.url}
										className='text-sky-500 hover:text-sky-700'>
										{content.text}
									</a>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className='flex justify-center gap-8 items-center'>
					{[<Linkedin />, <Facebook />, <Instagram />, <Twitter />].map((content) => (
						<Link
							className='border border-gunmetal rounded-full p-2 hover:border-white'
							style={{ boxShadow: '0px 0px 6px black' }}
							href='https://www.linkedin.com/'
							target='_blank'>
							{content}
						</Link>
					))}
				</div>

				<div className='grid justify-center font-thin text-center'>
					<p>Books 4 You &copy; {new Date().getFullYear()}</p>
				</div>
			</div>
		</div>
	);
};
