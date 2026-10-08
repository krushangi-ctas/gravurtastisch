import { ReactNode, Suspense } from 'react';

type FuseSuspenseProps = {
	children: ReactNode;
};

/**
 * The FuseSuspense component is a wrapper around the React Suspense component.
 */
function FuseSuspense(props: FuseSuspenseProps) {
	const { children } = props;
	return <Suspense fallback={null}>{children}</Suspense>;
}

export default FuseSuspense;
