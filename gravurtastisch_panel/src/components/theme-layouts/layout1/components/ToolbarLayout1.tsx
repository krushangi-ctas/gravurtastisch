import Toolbar from '@mui/material/Toolbar';
import clsx from 'clsx';
import { memo } from 'react';
import NavbarToggleButton from 'src/components/theme-layouts/components/navbar/NavbarToggleButton';
import useFuseLayoutSettings from '@fuse/core/FuseLayout/useFuseLayoutSettings';
import FullScreenToggle from '../../components/FullScreenToggle';
import { Layout1ConfigDefaultsType } from '@/components/theme-layouts/layout1/Layout1Config';
import useThemeMediaQuery from '../../../../@fuse/hooks/useThemeMediaQuery';
import { AppBar, Divider } from '@mui/material';
import ToolbarTheme from 'src/contexts/ToolbarTheme';

type ToolbarLayout1Props = {
  className?: string;
};

/**
 * The toolbar layout 1.
 */
function ToolbarLayout1(props: ToolbarLayout1Props) {
  const { className } = props;

  const settings = useFuseLayoutSettings();
  const config = settings.config as Layout1ConfigDefaultsType;
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

  return (
    <ToolbarTheme>
      <AppBar
        id="fuse-toolbar"
        className={clsx('relative z-20 flex', className)}
        sx={(theme) => ({
          backgroundColor: '#e0e0e0',
          color: theme.vars.palette.text.primary,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
        })}
      >
        <Toolbar className="min-h-12 px-4 py-0 md:min-h-12">
          <div className="flex flex-1 items-center gap-3">
            {config.navbar.display && config.navbar.position === 'left' && (
              <>
                <NavbarToggleButton />

                {/* <Divider orientation="vertical" flexItem variant="middle" /> */}
              </>
            )}
          </div>

          <div className="flex items-center overflow-x-auto">
            <FullScreenToggle />
          </div>

          {config.navbar.display && config.navbar.position === 'right' && (
            <>
              {!isMobile && (
                <>
                  <Divider orientation="vertical" flexItem variant="middle" />
                  <NavbarToggleButton />
                </>
              )}

              {isMobile && (
                <NavbarToggleButton className="h-10 w-10 p-0 sm:mx-2" />
              )}
            </>
          )}
        </Toolbar>
      </AppBar>
    </ToolbarTheme>
  );
}

export default memo(ToolbarLayout1);
