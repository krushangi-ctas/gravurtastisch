import { Button, ButtonProps, styled } from '@mui/material';
import { motion } from 'motion/react';

interface EnhancedButtonProps extends ButtonProps {
	variant?: 'send' | 'sent' | 'pending' | 'default';
	size?: 'small' | 'medium' | 'large';
}

const StyledButton = styled(Button, {
	shouldForwardProp: (prop) => prop !== 'buttonVariant'
})<{ buttonVariant?: string }>(({ theme, buttonVariant }) => ({
	borderRadius: 8,
	fontWeight: 600,
	fontSize: '0.875rem',
	textTransform: 'none',
	transition: 'all 0.2s ease-in-out',
	boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',

	...(buttonVariant === 'send' && {
		bgcolor: '#6366f1',
		color: 'white',
		'&:hover': {
			bgcolor: '#4f46e5',
			boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3), 0 4px 6px -2px rgba(99, 102, 241, 0.2)',
			transform: 'translateY(-1px)'
		},
		'&:active': {
			transform: 'translateY(0)'
		}
	}),

	...(buttonVariant === 'sent' && {
		bgcolor: '#059669',
		color: 'white',
		'&:hover': {
			bgcolor: '#047857',
			boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.3), 0 4px 6px -2px rgba(5, 150, 105, 0.2)'
		}
	}),

	...(buttonVariant === 'pending' && {
		bgcolor: '#ea580c',
		color: 'white',
		'&:hover': {
			bgcolor: '#c2410c',
			boxShadow: '0 10px 15px -3px rgba(234, 88, 12, 0.3), 0 4px 6px -2px rgba(234, 88, 12, 0.2)'
		}
	}),

	...(buttonVariant === 'default' && {
		bgcolor: theme.palette.primary.main,
		color: theme.palette.primary.contrastText,
		'&:hover': {
			bgcolor: theme.palette.primary.dark,
			boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.06)'
		}
	})
}));

const MotionButton: any = motion(StyledButton);

export default function EnhancedButton({ variant = 'default', children, ...props }: EnhancedButtonProps) {
	return (
		<MotionButton
			buttonVariant={variant}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			{...props}
		>
			{children}
		</MotionButton>
	);
}
