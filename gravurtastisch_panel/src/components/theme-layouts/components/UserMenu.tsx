import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
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

  return (
    <>
      <Button
        className={clsx(
          'user-menu flex shrink-0 justify-start',
          onlyAvatar
            ? 'min-w-0 p-0'
            : dense
              ? 'h-9 min-h-9 gap-1.5 px-1'
              : 'gap-3 py-4',
          className
        )}
        onClick={userMenuClick}
        color="inherit"
      >
        {effectiveUser?.avatar ? (
          <Avatar
            sx={(theme) => ({
              background: theme.vars.palette.background.default,
              color: theme.vars.palette.text.secondary,
            })}
            className={clsx('avatar', dense ? 'h-7 w-7' : 'h-10 w-10')}
            alt={effectiveUser?.name || 'user photo'}
            src={getImageUrl(effectiveUser.avatar as string)}
          />
        ) : (
          <Avatar
            sx={(theme) => ({
              background: (theme) =>
                darken(theme.palette.background.default, 0.05),
              color: theme.vars.palette.text.secondary,
            })}
            className={clsx('avatar h-10 w-10', dense && 'h-8 w-8')}
          >
            {effectiveUser?.name?.[0] || 'A'}
          </Avatar>
        )}
        {!onlyAvatar && (
          <>
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
                    {user.role?.toString()}
                    {(!user.role ||
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
          </>
        )}
      </Button>
      <Popover
        open={Boolean(userMenu)}
        anchorEl={userMenu}
        onClose={userMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        classes={{
          paper: 'min-w-36',
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
            <MenuItem
              component={Link}
              to="/settings/account"
              onClick={userMenuClose}
              role="button"
            >
              <ListItemIcon>
                <FuseSvgIcon>lucide:circle-user</FuseSvgIcon>
              </ListItemIcon>
              <ListItemText primary="My Profile" />
            </MenuItem>
            <MenuItem
              onClick={() => {
                userMenuClose();
                signOut();
                navigate('/sign-in', { replace: true });
              }}
            >
              <ListItemIcon>
                <FuseSvgIcon>lucide:square-arrow-right</FuseSvgIcon>
              </ListItemIcon>
              <ListItemText primary="Sign out" />
            </MenuItem>
          </>
        )}
      </Popover>
    </>
  );
}

export default UserMenu;
