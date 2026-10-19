import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

function AmazonHeader() {
  return (
    <div className="w-full">
      <div className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
            <FuseSvgIcon size={18} className="text-primary">
              heroicons-outline:key
            </FuseSvgIcon>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white m-0">
            Amazon Credentials & Authorization
          </h1>
        </div>
      </div>
    </div>
  );
}

export default AmazonHeader;

