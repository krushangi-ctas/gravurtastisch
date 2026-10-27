import NavLinkAdapter from '@fuse/core/NavLinkAdapter';
import clsx from 'clsx';
import { useMemo, ReactNode, useState, useEffect } from 'react';
import {
  Button,
  Collapse,
  IconButton,
  SxProps,
  Typography,
  TypographyProps,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import FuseNavBadge from '../../FuseNavBadge';
import FuseSvgIcon from '../../../FuseSvgIcon';
import { FuseNavItemType } from '../../types/FuseNavItemType';
import isUrlInChildren from '../../isUrlInChildren';
import usePathname from '@fuse/hooks/usePathname';
import Link from '@fuse/core/Link';

type FuseNavVerticalBaseProps = {
  item: FuseNavItemType;
  nestedLevel?: number;
  onItemClick?: (item: FuseNavItemType) => void;
  className?: string;
  component?: React.ElementType;
  children?: ReactNode;
  showIcon?: boolean;
  primaryTitleProps?: TypographyProps;
  subtitleProps?: TypographyProps;
  sx?: SxProps;
  checkPermission?: boolean;
  dense?: boolean;
};

function needsToBeOpened(pathname: string, item: FuseNavItemType) {
  return pathname && isUrlInChildren(item, pathname);
}

/**
 * FuseNavVerticalItemBase is a shared base component for all vertical navigation items
 */
function FuseNavVerticalItemBase(props: FuseNavVerticalBaseProps) {
  const {
    item,
    nestedLevel = 0,
    onItemClick,
    className,
    component,
    showIcon = true,
    primaryTitleProps = {},
    subtitleProps = {},
    sx,
    checkPermission,
    dense = false,
  } = props;

  const pathname = usePathname();

  const isGroup = useMemo(() => item.type === 'group', [item.type]);
  const isCollapsable = useMemo(() => item.type === 'collapse', [item.type]);

  const buttonComponent = useMemo(() => {
    if (component) {
      return component;
    }

    if (item.url) {
      if (
        item.url.startsWith('http') ||
        item.url.startsWith('mailto') ||
        item.url.startsWith('https')
      ) {
        return Link;
      }

      return NavLinkAdapter;
    }

    return 'div';
  }, [component, item.url]);
  const [open, setOpen] = useState(() => needsToBeOpened(pathname, item));

  useEffect(() => {
    if (isCollapsable && item.url) {
      setOpen((prev) => prev || needsToBeOpened(pathname, item));
    }
  }, [pathname, item, isCollapsable]);

  const itemProps = useMemo(
    () => ({
      ...(buttonComponent === NavLinkAdapter && {
        disabled: item.disabled,
        to: item.url || '',
        end: item.end,
        role: 'button',
        exact: item?.exact,
      }),
      ...(buttonComponent === Link && {
        disabled: item.disabled,
        to: item.url,
        role: 'button',
        target: item.target ? item.target : '_blank',
        exact: item?.exact,
      }),
    }),
    [item, buttonComponent]
  );

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();

    if (isCollapsable) {
      setOpen((prev) => prev || !prev);
    }

    if (onItemClick) {
      onItemClick(item);
    }
  }

  if (checkPermission && !item?.hasPermission) {
    return null;
  }

  const isItemActive = useMemo(() => {
    if (item.active) return true;
    if (!pathname || !item.url) return false;

    // Exact match
    if (pathname === item.url) return true;

    // Admin user-management tabs: Users, Section, Role
    if (item.id === 'user-management' || item.url === '/user-management/users') {
      return (
        pathname.startsWith('/user-management') ||
        pathname.startsWith('/sections') ||
        pathname.startsWith('/roles') ||
        pathname.startsWith('/users')
      );
    }

    // Seller team-management tabs: Team/Members, Section, Role
    if (item.id === 'team-management' || item.url === '/team/members') {
      return pathname.startsWith('/team');
    }

    // General prefix match for nested routes (e.g. /sellers/*, /support/*, /blogs/*, /settings/*)
    if (item.url !== '/') {
      const baseUrl = item.url.split('?')[0].replace(/\/$/, '');
      if (pathname === baseUrl || pathname.startsWith(`${baseUrl}/`)) {
        return true;
      }
    }

    return false;
  }, [item.active, item.id, item.url, pathname]);

  return (
    <>
      {(!isGroup || Boolean(item.title)) && (
        <Button
          component={buttonComponent}
          className={clsx(
            'mb-1 flex w-full items-center justify-start gap-3 rounded-lg py-2 px-3 transition-all duration-200 hover:shadow-sm',
            (item.active || isItemActive) && 'active',
            item.subtitle && 'items-start',
            className,
            isGroup && 'my-2',
            dense && 'py-1.5 px-2 mb-0.5'
          )}
          sx={{
            ...sx,
            borderLeft: '4px solid transparent',
            '&.active': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'light'
                  ? '#ffffff !important'
                  : `${alpha(theme.palette.primary.main, 0.16)} !important`,
              boxShadow: (theme) =>
                theme.palette.mode === 'light'
                  ? '0 2px 8px rgba(37, 99, 235, 0.08) !important'
                  : 'none !important',
              color: (theme) => `${theme.palette.primary.main} !important`,
              borderLeft: (theme) => `4px solid ${theme.palette.primary.main} !important`,
              borderTopLeftRadius: '8px !important',
              borderBottomLeftRadius: '8px !important',
              '& .fuse-list-item-icon': {
                color: (theme) => `${theme.palette.primary.main} !important`,
              },
              '& .fuse-list-item-title': {
                color: (theme) => `${theme.palette.primary.main} !important`,
                fontWeight: 600,
              },
              '&:hover': {
                backgroundColor: (theme) =>
                  theme.palette.mode === 'light'
                    ? '#ffffff !important'
                    : `${alpha(theme.palette.primary.main, 0.22)} !important`,
              },
            },
            '&:hover': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.65)!important'
                  : 'rgba(255, 255, 255, 0.08)!important',
              transform: 'translateX(2px)',
            },
          }}
          color="inherit"
          onClick={handleClick}
          aria-label={item.title}
          aria-expanded={open}
          {...itemProps}
        >
          {!isGroup && showIcon && item.icon && (
            <FuseSvgIcon
              className={clsx('fuse-list-item-icon', 'shrink-0', item.iconClass)}
              sx={{
                fontSize: '1.25rem',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {item.icon}
            </FuseSvgIcon>
          )}
          <div className="flex min-w-0 flex-auto flex-col items-start gap-2">
            {item.title && (
              <Typography
                {...{
                  ...primaryTitleProps,
                  className: clsx(
                    'fuse-list-item-title',
                    ' max-w-full font-medium',
                    isGroup && 'font-semibold text-xl',
                    primaryTitleProps?.className
                  ),
                  ...(isGroup && {
                    color: 'secondary',
                  }),
                }}
              >
                {item.title}
              </Typography>
            )}
            {item.subtitle && (
              <Typography
                {...{
                  color: 'text.secondary',
                  ...subtitleProps,
                  className: clsx(
                    'fuse-list-item-subtitle',
                    'text-md leading-none truncate max-w-full opacity-75',
                    subtitleProps?.className
                  ),
                }}
              >
                {item.subtitle}
              </Typography>
            )}
          </div>
          {item.badge && <FuseNavBadge badge={item.badge} />}

          {isCollapsable && (
            <IconButton
              disableRipple
              className="h-6 w-6 p-0 transition-all duration-200 hover:bg-transparent focus:bg-transparent"
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                setOpen(!open);
              }}
              sx={{
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
            >
              <FuseSvgIcon
                size={16}
                className="arrow-icon transition-transform duration-200"
                color="inherit"
              >
                {open ? 'lucide:chevron-down' : 'lucide:chevron-right'}
              </FuseSvgIcon>
            </IconButton>
          )}
        </Button>
      )}

      {isCollapsable && (
        <Collapse
          in={open}
          className="collapse-children"
          sx={{
            ...(nestedLevel < 4 && {
              paddingLeft: '20px',
              '& > .MuiCollapse-wrapper': {
                borderLeft: '2px solid',
                borderColor: 'divider',
                marginLeft: '8px',
                '& > .MuiCollapse-wrapperInner': {
                  paddingLeft: '12px',
                  paddingTop: '8px',
                },
              },
            }),
          }}
        >
          {item?.children?.map((_item) => (
            <FuseNavVerticalItemBase
              key={_item.id}
              item={_item}
              nestedLevel={isGroup ? nestedLevel : nestedLevel + 1}
              onItemClick={onItemClick}
              checkPermission={checkPermission}
            />
          ))}
        </Collapse>
      )}

      {isGroup &&
        item?.children?.map((_item) => (
          <FuseNavVerticalItemBase
            key={_item.id}
            item={_item}
            nestedLevel={isGroup ? nestedLevel : nestedLevel + 1}
            onItemClick={onItemClick}
            checkPermission={checkPermission}
          />
        ))}
    </>
  );
}

export default FuseNavVerticalItemBase;
