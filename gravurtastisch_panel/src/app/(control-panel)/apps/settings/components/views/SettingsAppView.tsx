'use client';

import { useEffect, useState } from 'react';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import FusePageSimple from '@fuse/core/FusePageSimple';
import usePathname from '@fuse/hooks/usePathname';
import { Navigate } from 'react-router';
import usePermissions from '@/hooks/usePermissions';
import SettingsAppSidebarContent from '../ui/SettingsAppSidebarContent';
import SettingsAppHeader from '../ui/SettingsAppHeader';
import { styled } from '@mui/material/styles';

const Root = styled(FusePageSimple)(({ theme }) => ({
  '& .FusePageSimple-contentWrapper': {
    overflow: 'hidden !important',
    paddingTop: 0,
    paddingLeft: 0,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    [theme.breakpoints.down('lg')]: {
      paddingTop: 0,
      paddingLeft: 0,
      overflow: 'hidden !important',
    },
  },
  '& .FusePageSimple-content': {
    boxShadow: 'none !important',
    borderRadius: '0 !important',
    backgroundColor: theme.vars.palette.background.paper,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    minHeight: 0,
    height: '100%',
    '& > .container': {
      maxWidth: '100% !important',
      width: '100% !important',
      minHeight: '100%',
      padding: '0 !important',
    },
  },
  '& .FusePageSimple-sidebarWrapper': {
    border: 'none',
  },
  '& .FusePageSimple-sidebarContent': {
    backgroundColor: theme.vars.palette.background.default,
  },
}));

type SettingsAppProps = {
  children?: React.ReactNode;
};

/**
 * The notes app.
 */
function SettingsAppView(props: SettingsAppProps) {
  const { children } = props;
  const { canView } = usePermissions();
  const pathname = usePathname();
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    setLeftSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      setLeftSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  if (!canView('settings')) {
    return <Navigate to="/" replace />;
  }

  return (
    <Root
      content={
        <div className="flex-auto w-full flex flex-col min-h-full">
          <SettingsAppHeader
            onSetSidebarOpen={setLeftSidebarOpen}
          />
          <div className="flex-auto w-full p-4 sm:p-6">
            {children}
          </div>
        </div>
      }
      leftSidebarProps={{
        open: leftSidebarOpen,
        onClose: () => {
          setLeftSidebarOpen(false);
        },
        content: (
          <SettingsAppSidebarContent onSetSidebarOpen={setLeftSidebarOpen} />
        ),
        width: 320,
      }}
      scroll="content"
    />
  );
}

export default SettingsAppView;
