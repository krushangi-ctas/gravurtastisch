import { motion } from 'motion/react';
import Box from '@mui/material/Box';

/**
 * The powered by links.
 */
function PoweredByLinks() {
	const container = {
		show: {
			transition: {
				staggerChildren: 0.04
			}
		}
	};

	// const item = {
	// 	hidden: { opacity: 0, scale: 0.6 },
	// 	show: { opacity: 1, scale: 1 }
	// };

	return (
		<Box
			component={motion.div}
			variants={container}
			initial="hidden"
			animate="show"
			className="flex items-center gap-1 overflow-hidden"
		></Box>
	);
}

export default PoweredByLinks;
