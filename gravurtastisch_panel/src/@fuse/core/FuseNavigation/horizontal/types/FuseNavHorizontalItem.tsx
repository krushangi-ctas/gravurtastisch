'use client';

import NavLinkAdapter from '@fuse/core/NavLinkAdapter';
import { styled } from '@mui/material/styles';
import ListItemText from '@mui/material/ListItemText';
import clsx from 'clsx';
import { memo, useMemo } from 'react';
import { ListItemButton, ListItemButtonProps } from '@mui/material';
import FuseNavBadge from '../../FuseNavBadge';
import FuseSvgIcon from '../../../FuseSvgIcon';
import usePathname from '@fuse/hooks/usePathname';
import { FuseNavItemComponentProps } from '../../FuseNavItem';

const Root = styled(ListItemButton)<ListItemButtonProps>(({ theme }) => ({
	color: theme.vars.palette.text.primary,
	textDecoration: 'none!important',
	flex: '0 1 auto',
	minHeight: 48,
	'&.active': {
		backgroundColor: `${theme.vars.palette.secondary.main}!important`,
		color: `${theme.vars.palette.secondary.contrastText}!important`,
		'& .fuse-list-item-text-primary': {
			color: 'inherit'
		},
		'& .fuse-list-item-icon': {
			color: 'inherit'
		}
	},
	'& .fuse-list-item-icon': {},
	'& .fuse-list-item-text': {
		padding: '0 0 0 16px'
	}
}));

type FuseNavHorizontalItemProps = FuseNavItemComponentProps;

/**
 * FuseNavHorizontalItem is a component responsible for rendering the navigation element in the horizontal menu in the Fuse theme.
 */
function FuseNavHorizontalItem(props: FuseNavHorizontalItemProps) {
	const { item, checkPermission } = props;
	const pathname = usePathname();
	const component = item.url ? NavLinkAdapter : 'li';

	const isItemActive = useMemo(() => {
		if (item.active) return true;
		if (!pathname || !item.url) return false;

		if (pathname === item.url) return true;

		if (item.id === 'user-management' || item.url === '/user-management/users') {
			return (
				pathname.startsWith('/user-management') ||
				pathname.startsWith('/sections') ||
				pathname.startsWith('/roles') ||
				pathname.startsWith('/users')
			);
		}

		if (item.id === 'team-management' || item.url === '/team/members') {
			return pathname.startsWith('/team');
		}

		if (item.url !== '/') {
			const baseUrl = item.url.split('?')[0].replace(/\/$/, '');
			if (pathname === baseUrl || pathname.startsWith(`${baseUrl}/`)) {
				return true;
			}
		}

		return false;
	}, [item.active, item.id, item.url, pathname]);

	const itemProps = useMemo(
		() => ({
			...(component !== 'li' && {
				disabled: item.disabled,
				to: item.url || '',
				end: item.end,
				role: 'button',
				exact: item?.exact
			})
		}),
		[item, component]
	);

	const memoizedContent = useMemo(
		() => (
			<Root
				component={component}
				className={clsx('fuse-list-item', (item.active || isItemActive) && 'active')}
				sx={item.sx}
				{...itemProps}
			>
				{item.icon && (
					<FuseSvgIcon
						className={clsx('fuse-list-item-icon shrink-0', item.iconClass)}
						color="action"
					>
						{item.icon}
					</FuseSvgIcon>
				)}

				<ListItemText
					className="fuse-list-item-text"
					primary={item.title}
					classes={{ primary: 'text-md fuse-list-item-text-primary truncate' }}
				/>

				{item.badge && (
					<FuseNavBadge
						className="ltr:ml-2 rtl:mr-2"
						badge={item.badge}
					/>
				)}
			</Root>
		),
		[component, item.active, item.badge, item.icon, item.iconClass, item.sx, item.title, itemProps]
	);

	if (checkPermission && !item?.hasPermission) {
		return null;
	}

	return memoizedContent;
}

const NavHorizontalItemWithMemo = memo(FuseNavHorizontalItem);

export default NavHorizontalItemWithMemo;
