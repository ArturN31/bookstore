import Person2OutlinedIcon from '@mui/icons-material/Person2Outlined';
import CakeIcon from '@mui/icons-material/Cake';
import HomeIcon from '@mui/icons-material/Home';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';

export const UserDetails = ({ userData }: { userData: User }) => {
    const {
        first_name,
        last_name,
        date_of_birth,
        street_address,
        city,
        country,
        phone_number, 
        email,
    } = userData;

    return (
        <div className="flex flex-col gap-5 rounded-lg bg-white p-6 shadow-md md:col-span-2 lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">User Details</h2>
            <div className="flex gap-4 rounded-md bg-gray-50 p-4">
                <Person2OutlinedIcon className="h-6 w-6 shrink-0 text-indigo-500" />
                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">Name:</p>
                    <p className="text-gray-600">
                        {first_name} {last_name}
                    </p>
                </div>
            </div>
            <div className="flex gap-4 rounded-md bg-gray-50 p-4">
                <CakeIcon className="h-6 w-6 shrink-0 text-green-500" />
                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">Born:</p>
                    <p className="text-gray-600">{new Date(date_of_birth).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="flex gap-4 rounded-md bg-gray-50 p-4">
                <HomeIcon className="h-6 w-6 shrink-0 text-blue-500" />
                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">Address:</p>
                    <p className="text-gray-600">
                        {street_address}, {city}, {country}
                    </p>
                </div>
            </div>
            <div
                className="flex gap-4 rounded-md bg-gray-50 p-4"
                aria-labelledby="addressHeading"
            >
                <PhoneIcon
                    className="h-5 w-5 shrink-0 text-indigo-500"
                    aria-hidden="true"
                />
                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">Phone:</p>
                    <p className="text-gray-600">{phone_number}</p>
                </div>
            </div>
            <div className="flex gap-4 rounded-md bg-gray-50 p-4">
                <EmailIcon className="h-5 w-5 shrink-0 text-green-500" />
                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-700">Email:</p>
                    <p className="text-gray-600">{email}</p>
                </div>
            </div>
        </div>
    );
};
