import AccountBoxIcon from '@mui/icons-material/AccountBox';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CakeIcon from '@mui/icons-material/Cake';
import HomeIcon from '@mui/icons-material/Home';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';

const getDisplayValue = (value?: string | null) => {
    if (!value || !value.trim()) return 'Not provided';
    return value;
};

const formatDateValue = (value?: string | null) => {
    if (!value || !value.trim()) return 'Not provided';

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) return 'Not provided';

    return parsedDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const UserDetails = ({ userData }: { userData: User }) => {
    const {
        username,
        first_name,
        last_name,
        date_of_birth,
        street_address,
        city,
        country,
        phone_number,
        email,
    } = userData;

    const profileItems = [
        {
            label: 'Username',
            value: getDisplayValue(username),
            icon: <AccountBoxIcon className="h-5 w-5" />,
            iconClassName: 'text-indigo-700',
        },
        {
            label: 'Name',
            value: [first_name, last_name].filter(Boolean).join(' ') || 'Not provided',
            icon: <AccountCircleIcon className="h-5 w-5" />,
            iconClassName: 'text-sky-700',
        },
        {
            label: 'Birthday',
            value: formatDateValue(date_of_birth),
            icon: <CakeIcon className="h-5 w-5" />,
            iconClassName: 'text-emerald-700',
        },
        {
            label: 'Address',
            value: [street_address, city, country].filter(Boolean).join(', ') || 'Not provided',
            icon: <HomeIcon className="h-5 w-5" />,
            iconClassName: 'text-blue-700',
        },
        {
            label: 'Phone',
            value: getDisplayValue(phone_number),
            icon: <PhoneIcon className="h-5 w-5" />,
            iconClassName: 'text-violet-700',
        },
        {
            label: 'Email',
            value: getDisplayValue(email),
            icon: <EmailIcon className="h-5 w-5" />,
            iconClassName: 'text-amber-700',
        },
    ];

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Personal information</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Review and keep your account details up to date for smoother orders.
                    </p>
                </div>
                <div className="inline-flex items-center self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                    Profile ready
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {profileItems.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                    >
                        <div
                            className={`flex h-full w-fit shrink-0 items-center justify-center ${item.iconClassName}`}
                        >
                            {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                            <p className="mt-1 text-sm wrap-break-word text-slate-600">
                                {item.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
