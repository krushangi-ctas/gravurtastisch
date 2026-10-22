import { useState, useEffect } from 'react';
import OrdersTable from '../../ui/orders/OrdersTable';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import AccessDeniedView from '@/components/AccessDeniedView';
import usePermissions from '@/hooks/usePermissions';
import { useMarketplace } from '../../../api/hooks/orders/useOrders';

const Root = styled(FusePageCarded)(() => ({
  padding: '0!important',
  '& .container': {
    maxWidth: '100%!important',
    padding: '0!important',
  },
  '& .FusePageCarded-wrapper': {
    borderRadius: '0!important',
    boxShadow: 'none!important',
    margin: '0!important',
  },
  '& .FusePageCarded-header': {
    marginBottom: '0px',
  },
  '& .FusePageCarded-contentWrapper': {
    overflow: 'hidden!important',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  },
  '& .FusePageCarded-content': {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    minHeight: 0,
    height: '100%',
    overflow: 'hidden',
  },
}));

/**
 * The orders page.
 */
function Orders() {
  const { canView, canUpdate } = usePermissions();
  const { data: marketplaces } = useMarketplace();
  const [searchDate, setSearchDate] = useState<Record<string, Date | null>>({
    from: null,
    to: null,
  });
  const [searchText, setSearchText] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string[]>([]);

  useEffect(() => {
    if (marketplaces && marketplaces.length > 0 && selectedMarketplace.length === 0) {
      const defaultMarketplace =
        marketplaces.find(
          (item: any) =>
            item.country_code?.toUpperCase() === 'DE' ||
            item.country?.toLowerCase() === 'germany' ||
            item.country?.toLowerCase() === 'deutschland'
        ) || marketplaces[0];
      if (defaultMarketplace) {
        setSelectedMarketplace([defaultMarketplace.marketplace_id]);
      }
    }
  }, [marketplaces, selectedMarketplace.length]);

  if (!canView('orders')) {
    return <AccessDeniedView sectionTitle="Orders" />;
  }

  return (
    <Root
      content={
        <OrdersTable
          searchDate={searchDate}
          setSearchDate={setSearchDate}
          searchText={searchText}
          setSearchText={setSearchText}
          selectedMarketplace={selectedMarketplace}
          setSelectedMarketplace={setSelectedMarketplace}
          canUpdateOrders={canUpdate('orders')}
        />
      }
      scroll="content"
    />
  );
}

export default Orders;
