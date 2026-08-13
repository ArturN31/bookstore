import { DateOfBirthInput } from '@/components/formItems/DateOfBirthInput';
import { TextInput } from '@/components/formItems/TextInput';
import { AddressFormFields } from '@/components/pages/user/profile/AddressForm/AddressForm';

export const UserPersonalFields = ({
    formData,
    onChange,
}: {
    formData: AddressFormFields;
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
