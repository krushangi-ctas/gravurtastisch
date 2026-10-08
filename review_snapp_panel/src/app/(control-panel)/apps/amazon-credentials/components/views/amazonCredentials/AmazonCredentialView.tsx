'use client';
import AmazonHeader from '../../ui/Amazon/AmazonHeader';
import { styled } from '@mui/material/styles';
import FusePageCarded from '@fuse/core/FusePageCarded';
import AmazonCredentialsView from '../../ui/Amazon/AmazonCredentialsView';

const Root = styled(FusePageCarded)(() => ({
	padding: '0!important',
	'& .container': {
		maxWidth: '100%!important',
		padding: '0!important'
	}
}));

/**
 * The Amazon page.
 */
function AmazonView() {
	return (
		<Root
			scroll="content"
			header={<AmazonHeader />}
			content={<AmazonCredentialsView />}
		/>
	);
}

export default AmazonView;
