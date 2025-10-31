import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import XIcon from '@mui/icons-material/X';

import Link from 'next/link';

export const Footer = () => {
	return (
		<div
			className='flex bg-gunmetal text-white p-8'
			data-testid='footer'>
			<div className='grid gap-5 m-auto max-w-[850px]'>
				<div className='grid items-center text-center'>
					<p data-testid='footer-mission'>
						We want to provide readers with a convenient and affordable way to access a
						vast library of digital books. We strive to offer a diverse selection of
						genres, exclusive titles, and exceptional customer service, ensuring a
						seamless and enjoyable reading experience for all.
					</p>
				</div>

				<div className='grid grid-cols-1 gap-10 md:grid-flow-col md:auto-cols-fr md:gap-5'>
					<div className='grid items-center'>
						<ul className='grid gap-2 text-center'>
							{[
								<div data-testid='footer-address'>
									<p>West Highland Way, Milngavie</p>
									<p>Glasgow, G62 6PB</p>
								</div>,
								<p data-testid='footer-number'>+44 7911 123456</p>,
								<a
									data-testid='footer-email'
									href='mailto:books4you.contact@b4u.com'
									className='text-sky-500 hover:text-sky-700'>
									books4you.contact@example.com
								</a>,
							].map((content, index) => (
								<li
									key={index}
									className='grid items-center gap-5'>
									{content}
								</li>
							))}
						</ul>
					</div>

					<div className='grid gap-3 items-center text-center'>
						<ul>
							{[
								{ text: 'Return Policy', url: '/infos/returnpolicy' },
								{ text: 'Privacy Policy', url: '/infos/privacypolicy' },
								{ text: 'Terms of Service', url: '/infos/tos' },
								{ text: 'Shipping Information', url: '/infos/shippinginfo' },
							].map((content, index) => (
								<li key={index}>
									<a
										data-testid={`footer-${content.text
											.toLocaleLowerCase()
											.replaceAll(' ', '-')}`}
										href={content.url}
										className='text-sky-500 hover:text-sky-700'>
										{content.text}
									</a>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className='flex justify-center gap-5'>
					{[
						{
							text: 'LinkedIn',
							icon: <LinkedInIcon />,
							url: 'https://www.linkedin.com/',
						},
						{
							text: 'Facebook',
							icon: <FacebookIcon />,
							url: 'https://www.facebook.com/',
						},
						{
							text: 'Instagram',
							icon: <InstagramIcon />,
							url: 'https://www.instagram.com/',
						},
						{ text: 'x', icon: <XIcon />, url: 'https://x.com/' },
					].map((social, index) => (
						<Link
							key={index}
							data-testid={`footer-${social.text.toLocaleLowerCase()}`}
							className='border border-gunmetal rounded-full p-2 hover:border-white'
							style={{ boxShadow: '0px 0px 6px black' }}
							href={social.url}
							target='_blank'>
							{social.icon}
						</Link>
					))}
				</div>

				<div className='grid justify-center font-thin text-center'>
					<p data-testid='footer-copyright'>
						Books 4 You &copy; {new Date().getFullYear()}
					</p>
				</div>
			</div>
		</div>
	);
};
