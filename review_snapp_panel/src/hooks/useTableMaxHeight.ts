import { useState, useEffect, useRef } from 'react';

/**
 * A custom hook to dynamically calculate the maximum height of a container
 * so that its bottom edge (and internal scrollable elements) does not exceed
 * the viewport, keeping bottom elements (like pagination) visible at a sticky offset.
 *
 * @param offsetBottom The margin in pixels to keep from the bottom of the viewport.
 */
export function useTableMaxHeight(offsetBottom = 10) {
	const ref = useRef<HTMLDivElement>(null);
	const [maxHeight, setMaxHeight] = useState<number | string>('auto');

	useEffect(() => {
		const calculateMaxHeight = () => {
			if (!ref.current) return;

			const rect = ref.current.getBoundingClientRect();
			const viewportHeight = window.innerHeight;

			// Available height from the element's top to the bottom of the viewport minus the offset
			const availableHeight = viewportHeight - rect.top - offsetBottom;

			// Fallback/minimum height to ensure usability (e.g., at least 200px)
			setMaxHeight(Math.max(200, availableHeight));
		};

		// Run initial calculation
		calculateMaxHeight();

		// Observe changes to the document body height (e.g., sidebar toggling, dynamic content loads)
		const resizeObserver = new ResizeObserver(() => {
			calculateMaxHeight();
		});

		resizeObserver.observe(document.body);
		window.addEventListener('resize', calculateMaxHeight);

		// Fallback delayed recalculation to ensure initial page rendering/layouts have settled
		const timeoutId = setTimeout(calculateMaxHeight, 150);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener('resize', calculateMaxHeight);
			clearTimeout(timeoutId);
		};
	}, [offsetBottom]);

	return { ref, maxHeight };
}
