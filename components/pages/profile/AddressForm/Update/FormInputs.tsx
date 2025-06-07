import { TextInput } from '../TextInput';

export const FormInputs = ({
	streetAddress,
	postcode,
	city,
	country,
}: {
	streetAddress: string;
	postcode: string;
	city: string;
	country: string;
}) => {
	return (
		<>
			<div className='flex justify-between gap-3'>
				{[
					{
						label: 'Street Address',
						id: 'streetAddress',
						defaultValue: streetAddress,
					},
					{
						label: 'Postcode',
						id: 'postcode',
						defaultValue: postcode,
					},
				].map((el) => (
					<TextInput
						key={el.id}
						label={el.label}
						id={el.id}
						defaultValue={el.defaultValue}
					/>
				))}
			</div>

			<div className='flex justify-between gap-3'>
				{[
					{
						label: 'City',
						id: 'city',
						defaultValue: city,
					},
					{
						label: 'Country',
						id: 'country',
						defaultValue: country,
					},
				].map((el) => (
					<TextInput
						key={el.id}
						label={el.label}
						id={el.id}
						defaultValue={el.defaultValue}
					/>
				))}
			</div>
		</>
	);
};
