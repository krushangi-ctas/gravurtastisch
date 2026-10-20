import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

function AmazonHeader() {
  return (
    <div className="w-full">
      <div className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary shrink-0 shadow-2xs">
            <FuseSvgIcon size={20} className="text-primary">
              heroicons-outline:key
            </FuseSvgIcon>
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0 leading-tight">
              Amazon Credentials & Authorization
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 m-0 font-medium leading-tight mt-1">
              Connect and authorize your Amazon Seller Central selling partner accounts and API keys.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AmazonHeader;

