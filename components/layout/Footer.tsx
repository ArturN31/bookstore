import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import XIcon from '@mui/icons-material/X';
import Link from 'next/link';

export const Footer = () => {
    return (
        <div
            className="bg-gunmetal flex p-8 text-white"
            data-testid="footer"
        >
            <div className="m-auto grid max-w-212.5 gap-5">
                <div className="grid items-center text-center">
                    <p data-testid="footer-mission">
                        We want to provide readers with a convenient and affordable way to access a
                        vast library of digital books. We strive to offer a diverse selection of
                        genres, exclusive titles, and exceptional customer service, ensuring a
                        seamless and enjoyable reading experience for all.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-10 md:auto-cols-fr md:grid-flow-col md:gap-5">
                    <div className="grid items-center">
                        <ul className="grid gap-2 text-center">
                            <li className="grid items-center gap-5">
                                <div data-testid="footer-address">
                                    <p>West Highland Way, Milngavie</p>
                                    <p>Glasgow, G62 6PB</p>
                                </div>
                            </li>
                            <li className="grid items-center gap-5">
                                <p data-testid="footer-number">+44 7911 123456</p>
                            </li>
                            <li className="grid items-center gap-5">
                                <a
                                    data-testid="footer-email"
                                    href="mailto:books4you.contact@example.com"
                                    className="text-sky-500 hover:text-sky-700"
                                >
                                    books4you.contact@example.com
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="grid items-center gap-3 text-center">
                        <ul className="grid gap-2">
                            {[
                                { text: 'Return Policy', url: '/infos/returnpolicy' },
                                { text: 'Privacy Policy', url: '/infos/privacypolicy' },
                                { text: 'Terms of Service', url: '/infos/tos' },
                                { text: 'Shipping Information', url: '/infos/shippinginfo' },
                            ].map((content, index) => (
                                <li key={index}>
                                    <Link
                                        data-testid={`footer-${content.text
                                            .toLocaleLowerCase()
                                            .replaceAll(' ', '-')}`}
                                        href={content.url}
                                        className="text-sky-500 hover:text-sky-700"
                                    >
                                        {content.text}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="flex justify-center gap-5">
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
                        { text: 'X', icon: <XIcon />, url: 'https://x.com/' },
                    ].map((social, index) => (
                        <Link
                            key={index}
                            aria-label={`Follow us on ${social.text}`}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border-gunmetal rounded-full border p-2 shadow-[0px_0px_6px_black] transition-colors hover:border-white"
                        >
                            {social.icon}
                        </Link>
                    ))}
                </div>

                <div className="grid justify-center text-center font-thin">
                    <p data-testid="footer-copyright">
                        Books 4 You &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
};
