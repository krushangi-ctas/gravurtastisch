import { Control } from 'react-hook-form';
import { debounce } from 'lodash';
import { Controller } from 'react-hook-form';
import { FuseSettingsConfigType } from '../FuseSettings';
import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { FormControl, FormLabel, TextField } from '@mui/material';

type NumberFormControllerProps = {
	name: keyof FuseSettingsConfigType;
	control: Control<FuseSettingsConfigType>;
	item: {
		title: string;
		min?: number;
		max?: number;
	};
};

function NumberFormController(props: NumberFormControllerProps) {
	const { name, control, item } = props;

	return (
		<div
			key={name}
			className="FuseSettings-formControl"
		>
			<Controller
				name={name}
				control={control}
				render={({ field: { onChange, value } }) => (
					<NumberTextField
						name={name}
						value={+value}
						onChange={onChange}
						item={item}
					/>
				)}
			/>
		</div>
	);
}

type NumberTextFieldProps = {
	value: number;
	onChange: (value: number) => void;
	item: NumberFormControllerProps['item'];
	name: string;
};

function NumberTextField(props: NumberTextFieldProps) {
	const { value, onChange, item, name } = props;
	const [localValue, setLocalValue] = useState(value);
	const [error, setError] = useState('');

	const debouncedOnChange = useRef(
		debounce((newValue: number) => {
			onChange(newValue);
		}, 500)
	).current;

	const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
		const val = ev.target.value;
		const newValue = +val;

		if (val !== '' && (isNaN(newValue) || newValue <= 0)) {
			setError('Must be greater than 0');
			setLocalValue(newValue);
			return;
		}

		if (item?.min && newValue < item?.min) {
			setError(`Value is too low (min: ${item?.min})`);
			setLocalValue(newValue);
			return;
		}

		if (item?.max && newValue > item?.max) {
			setError(`Value is too high (max: ${item?.max})`);
			setLocalValue(newValue);
			return;
		}

		setError('');
		setLocalValue(newValue);
		debouncedOnChange(newValue);
	};

	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	return (
		<FormControl>
			<FormLabel htmlFor={`${name}-input`}>{item.title}</FormLabel>
			<TextField
				id={`${name}-input`}
				value={localValue}
				onChange={handleChange}
				type="number"
				onKeyDown={(e) => {
					if (e.key === '-' || e.key === 'e' || e.key === 'E') {
						e.preventDefault();
					}
				}}
				onWheel={(e) => (e.target as HTMLElement).blur()}
				slotProps={{
					input: {
						inputProps: { min: Math.max(1, item?.min ?? 1), max: item?.max }
					}
				}}
				variant="outlined"
				error={!!error}
				helperText={error}
			/>
		</FormControl>
	);
}

export default NumberFormController;
