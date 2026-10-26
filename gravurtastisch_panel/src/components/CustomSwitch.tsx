import React from 'react';
import { Switch, SwitchProps } from '@mui/material';

/**
 * Custom Status Switch matching the project-wide primary theme design:
 * Clean, modern Switch with primary brand color when active.
 */
export const CustomStatusSwitch: React.FC<SwitchProps> = (props) => {
	return <Switch color="primary" {...props} />;
};

export default CustomStatusSwitch;

