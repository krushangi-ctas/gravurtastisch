'use client';
import { styled, useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import { memo, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import SettingsPanel from 'src/components/theme-layouts/components/configurator/SettingsPanel';
import ThemesPanel from 'src/components/theme-layouts/components/configurator/ThemesPanel';
import useUser from '@auth/useUser';

const Root = styled('div')(({ theme }) => ({
	position: 'absolute',
	height: 68,
	right: 0,
	top: 180,
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	overflow: 'hidden',
	padding: 0,
	borderTopLeftRadius: 8,
	borderBottomLeftRadius: 8,
	borderBottomRightRadius: 0,
	borderTopRightRadius: 0,
	zIndex: 999,
	color: '#ffffff',
	backgroundColor: '#475569',
	boxShadow: '0 2px 8px -1px rgba(0,0,0,0.2)',
	transition: 'background-color 200ms ease, opacity 200ms ease',
	opacity: 0.85,
	'&:hover': {
		backgroundColor: '#334155',
		opacity: 1
	},
	'& .settingsButton': {
		'& > span': {
			animation: 'rotating 3s linear infinite'
		}
	},
	'@keyframes rotating': {
		from: {
			transform: 'rotate(0deg)'
		},
		to: {
			transform: 'rotate(360deg)'
		}
	}
}));

/**
 * The settings panel.
 */
function Configurator() {
	const theme = useTheme();
	const { isGuest } = useUser();
	const [open, setOpen] = useState('');

	const handlerOptions = {
		onSwipedLeft: () => Boolean(open) && theme.direction === 'rtl' && handleClose(),
		onSwipedRight: () => Boolean(open) && theme.direction === 'ltr' && handleClose()
	};

	const settingsHandlers = useSwipeable(handlerOptions);
	const schemesHandlers = useSwipeable(handlerOptions);

	const handleOpen = (panelId: string) => {
		setOpen(panelId);
	};

	const handleClose = () => {
		setOpen('');
	};

	if (isGuest) {
		return null;
	}

	return (
		<>
			<Root
				id="fuse-settings-panel"
				className="buttonWrapper"
			>
				<Button
					className="settingsButton m-0 h-8 w-8 min-w-8"
					onClick={() => handleOpen('settings')}
					variant="text"
					color="inherit"
					disableRipple
					disableFocusRipple
					autoFocus={false}
				>
					<span>
						<FuseSvgIcon size={16}>lucide:settings</FuseSvgIcon>
					</span>
				</Button>

				<Button
					className="m-0 h-8 w-8 min-w-8"
					onClick={() => handleOpen('schemes')}
					variant="text"
					color="inherit"
					disableRipple
					autoFocus={false}
				>
					<FuseSvgIcon size={16}>lucide:swatch-book</FuseSvgIcon>
				</Button>
			</Root>

			<SettingsPanel
				open={Boolean(open === 'settings')}
				onClose={handleClose}
				settingsHandlers={settingsHandlers}
			/>

			<ThemesPanel
				schemesHandlers={schemesHandlers}
				onClose={handleClose}
				open={Boolean(open === 'schemes')}
			/>
		</>
	);
}

export default memo(Configurator);
