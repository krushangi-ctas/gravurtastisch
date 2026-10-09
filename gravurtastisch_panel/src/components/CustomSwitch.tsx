import React from 'react';
import { Switch, SwitchProps } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * Custom Status Switch matching the exact design:
 * - Checked (Active): Dark navy thumb with white checkmark icon on soft slate/gray track.
 * - Unchecked (Inactive): Vivid red thumb with white minus icon on soft pink/red track.
 */
const StyledSwitch = styled((props: SwitchProps) => (
	<Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
	width: 38,
	height: 20,
	padding: 0,
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	position: 'relative',
	overflow: 'visible',
	'&:active': {
		'& .MuiSwitch-thumb': {
			width: 19
		},
		'& .MuiSwitch-switchBase.Mui-checked': {
			transform: 'translate(19px, -50%)'
		}
	},
	'& .MuiSwitch-switchBase': {
		padding: 0,
		position: 'absolute',
		top: '50%',
		left: 0,
		transform: 'translate(1px, -50%)',
		transitionDuration: '250ms',
		zIndex: 1,
		'& .MuiSwitch-thumb': {
			boxSizing: 'border-box',
			width: 18,
			height: 18,
			borderRadius: '50%',
			backgroundColor: '#ef4444', // Red thumb when inactive
			backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' width='16' height='16' fill='none' stroke='white' stroke-width='2.8' stroke-linecap='round' stroke-linejoin='round'><line x1='3' y1='8' x2='13' y2='8'></line></svg>")`,
			backgroundRepeat: 'no-repeat',
			backgroundPosition: 'center center',
			backgroundSize: '11px 11px',
			boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.2)'
		},
		'&.Mui-checked': {
			transform: 'translate(19px, -50%)',
			color: '#fff',
			'& .MuiSwitch-thumb': {
				backgroundColor: '#0f2b5c', // Navy primary thumb when active
				backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' width='16' height='16' fill='none' stroke='white' stroke-width='2.8' stroke-linecap='round' stroke-linejoin='round'><path d='M3 8.5l3.2 3.2 6.8-7.5'></path></svg>")`,
				backgroundRepeat: 'no-repeat',
				backgroundPosition: 'center center',
				backgroundSize: '12px 12px',
				boxShadow: '0 2px 4px 0 rgba(15, 43, 92, 0.3)'
			},
			'& + .MuiSwitch-track': {
				backgroundColor: '#e2e8f0', // Slim soft slate track when active
				opacity: 1,
				border: 0
			}
		}
	},
	'& .MuiSwitch-track': {
		height: 12,
		width: '100%',
		borderRadius: 6,
		position: 'absolute',
		top: '50%',
		left: 0,
		transform: 'translateY(-50%)',
		margin: 0,
		backgroundColor: '#fee2e2', // Slim soft pink/red track when inactive
		opacity: 1,
		transition: theme.transitions.create(['background-color'], {
			duration: 250
		})
	},
	'&.MuiSwitch-sizeSmall': {
		width: 32,
		height: 18,
		'& .MuiSwitch-switchBase': {
			padding: 0,
			top: '50%',
			left: 0,
			transform: 'translate(1px, -50%)',
			'& .MuiSwitch-thumb': {
				width: 16,
				height: 16,
				backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' width='16' height='16' fill='none' stroke='white' stroke-width='2.8' stroke-linecap='round' stroke-linejoin='round'><line x1='3' y1='8' x2='13' y2='8'></line></svg>")`,
				backgroundRepeat: 'no-repeat',
				backgroundPosition: 'center center',
				backgroundSize: '10px 10px'
			},
			'&.Mui-checked': {
				transform: 'translate(15px, -50%)',
				'& .MuiSwitch-thumb': {
					backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' width='16' height='16' fill='none' stroke='white' stroke-width='2.8' stroke-linecap='round' stroke-linejoin='round'><path d='M3 8.5l3.2 3.2 6.8-7.5'></path></svg>")`,
					backgroundRepeat: 'no-repeat',
					backgroundPosition: 'center center',
					backgroundSize: '11px 11px'
				},
				'& + .MuiSwitch-track': {
					backgroundColor: '#e2e8f0'
				}
			}
		},
		'& .MuiSwitch-track': {
			height: 10,
			borderRadius: 5,
			top: '50%',
			transform: 'translateY(-50%)',
			margin: 0
		}
	}
}));

export const CustomStatusSwitch: React.FC<SwitchProps> = (props) => {
	return <StyledSwitch {...props} />;
};

export default CustomStatusSwitch;
