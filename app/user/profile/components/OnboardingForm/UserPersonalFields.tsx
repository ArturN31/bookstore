import { DateOfBirthInput } from '@/components/formItems/DateOfBirthInput';
import { TextInput } from '@/components/formItems/TextInput';
import { OnboardingFormFields } from './OnboardingForm';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

export const UserPersonalFields = ({
    formData,
    onChange,
}: {
    formData: OnboardingFormFields;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
    <>
        <div className="flex gap-3">
            <TextInput
                label="First Name"
                id="firstName"
                value={formData.firstName}
                onChange={onChange}
            />
            <TextInput
                label="Last Name"
                id="lastName"
                value={formData.lastName}
                onChange={onChange}
            />
        </div>

        <div className="relative grid w-full">
            <label
                htmlFor="username"
                className="inline-block rounded-sm px-1 text-sm font-medium text-gray-700 transition-colors duration-200 focus-within:bg-blue-100 focus-within:text-blue-700"
            >
                Username
            </label>
            <div className="relative">
                <div className="pointer-events-none absolute top-2 flex items-center pl-3 text-gray-400">
                    <PersonRoundedIcon aria-hidden="true" />
                </div>
                <input
                    autoComplete="off"
                    required
                    type="text"
                    id="username"
                    data-testid="username-field"
                    name="username"
                    placeholder="Choose a unique username"
                    value={formData.username ?? ''}
                    onChange={onChange}
                    className="block w-full rounded-md border border-gray-300 py-2 pl-10 text-sm focus:border-blue-500 focus:outline-none"
                    aria-describedby="username-helper"
                />
            </div>
            <p
                id="username-helper"
                className="mt-1 text-xs text-gray-500"
            >
                This will be your unique public display name.
            </p>
        </div>

        <div className="flex gap-3">
            <DateOfBirthInput
                dob={formData.dob}
                onChange={onChange}
            />
            <TextInput
                label="Phone"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={onChange}
            />
        </div>
    </>
);
