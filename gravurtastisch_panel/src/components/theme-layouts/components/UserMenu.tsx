import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import Link from '@fuse/core/Link';
import { useNavigate } from 'react-router';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { darken } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import clsx from 'clsx';
import Popover, { PopoverProps } from '@mui/material/Popover';
import useUser from '@auth/useUser';
import { getImageUrl } from '@/configs/env';
import { useProfile } from '@/app/(control-panel)/apps/settings/api/hooks/account/useAccountSettings';

type UserMenuProps = {
  className?: string;
  popoverProps?: Partial<PopoverProps>;
  arrowIcon?: string;
  dense?: boolean;
  onlyAvatar?: boolean;
};

/**
 * The user menu.
 */
function UserMenu(props: UserMenuProps) {
  const navigate = useNavigate();
  const {
    className,
    popoverProps,
    arrowIcon = 'lucide:chevron-up',
    dense = false,
    onlyAvatar = false,
  } = props;
  const { data: user, signOut, isGuest } = useUser();
  const { data: profileResponse } = useProfile();
  const effectiveUser = profileResponse?.data || user;

  const [userMenu, setUserMenu] = useState<HTMLElement | null>(null);
  const userMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenu(event.currentTarget);
  };

  const userMenuClose = () => {
    setUserMenu(null);
  };

  if (!effectiveUser) {
    return null;
  }

  const avatarElement = effectiveUser?.avatar ? (
    <Avatar
      sx={(theme) => ({
        background: theme.vars.palette.background.default,
        color: theme.vars.palette.text.secondary,
      })}
      className={clsx('avatar ring-1 ring-slate-300 dark:ring-slate-700', dense ? 'h-7 w-7' : 'h-8.5 w-8.5')}
      alt={effectiveUser?.name || 'user photo'}
      src={getImageUrl(effectiveUser.avatar as string)}
    />
  ) : (
    <Avatar
      sx={(theme) => ({
        background: (theme) =>
          darken(theme.palette.background.default, 0.05),
        color: theme.vars.palette.text.secondary,
        border: `1px solid ${theme.vars.palette.divider}`,
      })}
      className={clsx('avatar shadow-xs', dense ? 'h-7 w-7' : 'h-8.5 w-8.5')}
    >
      <FuseSvgIcon size={dense ? 16 : 18} className="text-slate-700 dark:text-slate-200">
        lucide:user
      </FuseSvgIcon>
    </Avatar>
  );

  return (
    <>
      {onlyAvatar ? (
        <Tooltip title={effectiveUser?.name || 'Account'} arrow>
          <IconButton
            onClick={userMenuClick}
            className={clsx(
              'user-menu p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
              className
            )}
            size="small"
          >
            {avatarElement}
          </IconButton>
        </Tooltip>
      ) : (
        <Button
          className={clsx(
            'user-menu flex shrink-0 justify-start',
            dense ? 'h-9 min-h-9 gap-1.5 px-1' : 'gap-3 py-4',
            className
          )}
          onClick={userMenuClick}
          color="inherit"
        >
          {avatarElement}
          <div
            className={clsx('flex flex-auto flex-col', dense ? '' : 'gap-2')}
          >
            <Typography
              component="span"
              className={clsx(
                'title flex truncate leading-none font-semibold tracking-tight capitalize',
                dense ? 'text-md' : 'text-base'
              )}
            >
              {effectiveUser?.name as string}
            </Typography>
            <Typography
              className={clsx(
                'flex leading-none font-medium tracking-tighter',
                dense ? 'text-sm' : 'text-md'
              )}
              color="text.secondary"
            >
              {effectiveUser?.email}
            </Typography>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Tooltip
              title={
                <>
                  {user?.role?.toString()}
                  {(!user?.role ||
                    (Array.isArray(user.role) && user.role.length === 0)) &&
                    'Guest'}
                </>
              }
            >
              <FuseSvgIcon className="info-icon">lucide:info</FuseSvgIcon>
            </Tooltip>
            <FuseSvgIcon className="arrow" size={13}>
              {arrowIcon}
            </FuseSvgIcon>
          </div>
        </Button>
      )}

      <Popover
        open={Boolean(userMenu)}
        anchorEl={userMenu}
        onClose={userMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
          ...popoverProps?.anchorOrigin,
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
          ...popoverProps?.transformOrigin,
        }}
        slotProps={{
          paper: {
            className:
              'min-w-56 py-2 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl',
          },
        }}
        {...popoverProps}
      >
        {isGuest ? (
          <>
            <MenuItem component={Link} to="/sign-in" role="button">
              <ListItemIcon>
                <FuseSvgIcon>lucide:lock</FuseSvgIcon>
              </ListItemIcon>
              <ListItemText primary="Sign In" />
            </MenuItem>
          </>
        ) : (
          <>
            <div className="px-4 py-2.5 border-b border-divider mb-1">
              <Typography className="text-sm font-semibold truncate text-slate-800 dark:text-slate-100">
                {effectiveUser?.name || 'User'}
              </Typography>
              <Typography className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {effectiveUser?.email || ''}
              </Typography>
            </div>
            <MenuItem
              component={Link}
              to="/settings/account"
              onClick={userMenuClose}
              role="button"
              className="gap-2 py-2"
            >
              <ListItemIcon className="min-w-0 mr-1 text-slate-600 dark:text-slate-400">
                <FuseSvgIcon size={18}>lucide:circle-user</FuseSvgIcon>
              </ListItemIcon>
              <ListItemText
                primary="Profile"
                primaryTypographyProps={{ className: 'text-sm font-medium' }}
              />
            </MenuItem>
            <Divider className="my-1" />
            <MenuItem
              onClick={() => {
                userMenuClose();
                signOut();
                navigate('/sign-in', { replace: true });
              }}
              className="gap-2 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <ListItemIcon className="min-w-0 mr-1 text-red-600 dark:text-red-400">
                <FuseSvgIcon size={18}>lucide:log-out</FuseSvgIcon>
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{
                  className: 'text-sm font-medium text-red-600 dark:text-red-400',
                }}
              />
            </MenuItem>
          </>
        )}
      </Popover>
    </>
  );
}

export default UserMenu;
