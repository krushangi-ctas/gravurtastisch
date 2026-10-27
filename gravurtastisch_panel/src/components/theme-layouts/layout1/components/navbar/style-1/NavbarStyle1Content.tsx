import FuseScrollbars from '@fuse/core/FuseScrollbars';
import { styled } from '@mui/material/styles';
import clsx from 'clsx';
import { memo } from 'react';
import IconButton from '@mui/material/IconButton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import Logo from 'src/components/theme-layouts/components/Logo';
import Navigation from 'src/components/theme-layouts/components/navigation/Navigation';
import UserMenu from 'src/components/theme-layouts/components/UserMenu';
import { useNavbarContext } from '@/components/theme-layouts/components/navbar/contexts/NavbarContext/useNavbarContext';

const Root = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.grey[200],
  color: theme.vars.palette.text.primary,
  ...theme.applyStyles('dark', {
    backgroundColor: theme.vars.palette.background.default,
    color: theme.vars.palette.text.primary,
  }),
  '& ::-webkit-scrollbar-thumb': {
    boxShadow: `inset 0 0 0 20px ${'rgba(255, 255, 255, 0.24)'}`,
    ...theme.applyStyles('light', {
      boxShadow: `inset 0 0 0 20px ${'rgba(0, 0, 0, 0.24)'}`,
    }),
  },
  '& ::-webkit-scrollbar-thumb:active': {
    boxShadow: `inset 0 0 0 20px ${'rgba(255, 255, 255, 0.37)'}`,
    ...theme.applyStyles('light', {
      boxShadow: `inset 0 0 0 20px ${'rgba(0, 0, 0, 0.37)'}`,
    }),
  },
}));

const StyledContent = styled(FuseScrollbars)(() => ({
  overscrollBehavior: 'contain',
  overflowX: 'hidden',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '100% 40px, 100% 10px',
  backgroundAttachment: 'local, scroll',
}));

type NavbarStyle1ContentProps = {
  className?: string;
};

/**
 * The navbar style 1 content.
 */
function NavbarStyle1Content(props: NavbarStyle1ContentProps) {
  const { className = '' } = props;
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
  const { closeMobileNavbar } = useNavbarContext();

  return (
    <Root
      className={clsx(
        'flex h-full flex-auto flex-col overflow-hidden bg-gray-200 dark:bg-slate-900',
        className
      )}
    >
      <div
        className={clsx(
          'flex h-20 shrink-0 items-center px-4 border-b border-gray-300 dark:border-slate-800',
          isMobile ? 'justify-between' : 'justify-center'
        )}
      >
        <Logo />
        {isMobile && (
          <IconButton
            onClick={() => closeMobileNavbar()}
            aria-label="close navigation"
            size="small"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <FuseSvgIcon size={20}>lucide:x</FuseSvgIcon>
          </IconButton>
        )}
      </div>

      <StyledContent
        className="flex min-h-0 flex-1 flex-col"
        option={{ suppressScrollX: true, wheelPropagation: false }}
      >
        <Navigation layout="vertical" />
      </StyledContent>

      {/* <div
        className="flex flex-col gap-3"
        style={{
          color: 'black',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
          borderTop: `1px solid #e0e0e0`,
        }}
      >
        <UserMenu className="w-full" />
      </div> */}
    </Root>
  );
}

export default memo(NavbarStyle1Content);
