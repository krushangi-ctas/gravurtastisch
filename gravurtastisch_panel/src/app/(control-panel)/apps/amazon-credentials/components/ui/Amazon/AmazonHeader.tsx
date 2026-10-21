import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import NavbarToggleButton from '@/components/theme-layouts/components/navbar/NavbarToggleButton';

function AmazonHeader() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

  return (
    <div className="w-full">
      <div className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {isMobile && (
            <NavbarToggleButton
              className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 shrink-0 -ml-1 border-0"
              aria-label="open navigation menu"
            >
              <FuseSvgIcon size={20}>heroicons-outline:bars-3</FuseSvgIcon>
            </NavbarToggleButton>
          )}
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary shrink-0 shadow-2xs">
            <FuseSvgIcon size={20} className="text-primary">
              heroicons-outline:key
            </FuseSvgIcon>
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0 leading-tight">
              Amazon Credentials & Authorization
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 m-0 font-medium leading-tight mt-0.5 sm:mt-1">
              Connect and authorize your Amazon Seller Central selling partner accounts and API keys.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AmazonHeader;

