import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

function AmazonHeader() {
  return (
    <div className="w-full">
      <div className="w-full bg-primary-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/15 text-white">
            <FuseSvgIcon size={18} className="text-white">
              heroicons-outline:key
            </FuseSvgIcon>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white m-0">
            Amazon Credentials & Authorization
          </h1>
        </div>
      </div>
    </div>
  );
}

export default AmazonHeader;

