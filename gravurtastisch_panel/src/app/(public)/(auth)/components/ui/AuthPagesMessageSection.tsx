import AvatarGroup from '@mui/material/AvatarGroup';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

const FEATURES = [
	{
		icon: 'heroicons-solid:photo',
		label: 'Photo Cups & Mugs',
		description: 'Full-wrap prints and heat-changing cups',
		accentColor: '#E89B5C',
		badgeBg: 'rgba(232, 155, 92, 0.14)',
		borderColor: 'rgba(232, 155, 92, 0.35)'
	},
	{
		icon: 'heroicons-solid:sparkles',
		label: 'Laser Engraving',
		description: 'Boards, coasters, wallets & keepsakes',
		accentColor: '#C4B5FD',
		badgeBg: 'rgba(196, 181, 253, 0.14)',
		borderColor: 'rgba(196, 181, 253, 0.35)'
	},
	{
		icon: 'heroicons-solid:shopping-bag',
		label: 'Custom Apparel',
		description: 'DTG prints, embroidery & tote bags',
		accentColor: '#86EFAC',
		badgeBg: 'rgba(134, 239, 172, 0.12)',
		borderColor: 'rgba(134, 239, 172, 0.3)'
	},
	{
		icon: 'heroicons-solid:clipboard-document-check',
		label: 'Order Desk',
		description: 'Proofs, production & delivery in one place',
		accentColor: '#F9A8D4',
		badgeBg: 'rgba(249, 168, 212, 0.12)',
		borderColor: 'rgba(249, 168, 212, 0.3)'
	}
];

function AuthPagesMessageSection() {
	return (
		<Box
			className="relative hidden min-h-screen w-full flex-col justify-between overflow-hidden p-8 md:flex md:w-1/2 lg:px-16 lg:py-12 select-none"
			sx={{
				background: 'linear-gradient(145deg, #2A1848 0%, #452B78 42%, #1A0F2E 100%)',
				color: 'primary.contrastText'
			}}
		>
			<div className="pointer-events-none absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full bg-purple-500/20 blur-[120px]" />
			<div className="pointer-events-none absolute bottom-10 right-1/4 h-[380px] w-[380px] rounded-full bg-amber-400/10 blur-[120px]" />

			<Box
				component="svg"
				className="pointer-events-none absolute top-0 right-0"
				sx={{ color: 'primary.light', opacity: 0.08 }}
				viewBox="0 0 320 260"
				width="320px"
				height="260px"
				fill="none"
			>
				<defs>
					<pattern
						id="auth-dot-grid"
						x="0"
						y="0"
						width="24"
						height="24"
						patternUnits="userSpaceOnUse"
					>
						<circle cx="3" cy="3" r="1.5" fill="currentColor" />
					</pattern>
				</defs>
				<rect width="320" height="260" fill="url(#auth-dot-grid)" />
			</Box>

			<div className="relative z-10 w-full max-w-2xl flex flex-col my-auto py-4">
				<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-300/30 bg-purple-400/10 px-3.5 py-1 backdrop-blur-md self-start">
					<span className="relative flex h-2 w-2">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
						<span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" />
					</span>
					<span className="text-[11px] font-bold tracking-widest text-purple-100 uppercase">
						Custom Engraving Studio
					</span>
				</div>

				<Typography
					sx={{
						fontSize: { xs: 32, sm: 38, lg: 44 },
						fontWeight: 800,
						lineHeight: 1.15,
						letterSpacing: '-0.025em',
						color: '#ffffff',
						textShadow: '0 2px 14px rgba(0,0,0,0.4)'
					}}
				>
					Photo cups, kitchenware &amp;{' '}
					<span className="bg-gradient-to-r from-amber-300 via-orange-200 to-purple-200 bg-clip-text text-transparent">
						engraved keepsakes
					</span>
				</Typography>

				<Typography
					sx={{
						mt: 2,
						fontSize: { xs: 14.5, sm: 15.5, lg: 16 },
						lineHeight: 1.6,
						color: 'rgba(226, 232, 240, 0.85)',
						maxWidth: 520
					}}
				>
					Manage customisation orders, digital proofs, and production from one Gravurtastisch
					desk — built for personalised gifts and engraved goods.
				</Typography>

				<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
					{FEATURES.map((feature) => (
						<div
							key={feature.label}
							className="group flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-300/35 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/40"
						>
							<div
								className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
								style={{
									backgroundColor: feature.badgeBg,
									color: feature.accentColor,
									border: `1px solid ${feature.borderColor}`
								}}
							>
								<FuseSvgIcon size={22}>{feature.icon}</FuseSvgIcon>
							</div>

							<div className="min-w-0">
								<Typography
									sx={{
										fontSize: 14,
										fontWeight: 700,
										lineHeight: 1.3,
										color: '#f8fafc'
									}}
								>
									{feature.label}
								</Typography>
								<Typography
									sx={{
										fontSize: 12,
										color: 'rgba(203, 213, 225, 0.75)',
										mt: 0.4,
										lineHeight: 1.4
									}}
								>
									{feature.description}
								</Typography>
							</div>
						</div>
					))}
				</div>

				<div className="mt-4 flex items-center justify-between rounded-xl border border-amber-400/25 bg-amber-950/20 px-4 py-2.5 backdrop-blur-md">
					<div className="flex items-center gap-2">
						<span className="flex h-2 w-2 rounded-full bg-amber-300 animate-pulse" />
						<span className="text-xs font-semibold text-amber-100">
							Free digital proof on custom orders
						</span>
					</div>
					<div className="flex items-center gap-1.5 text-xs font-bold text-amber-200">
						<span>Handcrafted</span>
						<span className="text-slate-300 ml-1">with precision</span>
					</div>
				</div>
			</div>

			<div className="relative z-10 flex items-center justify-between gap-3 pt-4 border-t border-white/10 mt-4">
				<div className="flex items-center gap-3.5">
					<AvatarGroup
						sx={{
							'& .MuiAvatar-root': {
								width: 36,
								height: 36,
								border: '2px solid #2A1848',
								boxShadow: '0 2px 8px rgba(0,0,0,0.35)'
							}
						}}
					>
						<Avatar src="/assets/images/avatars/female-18.jpg" alt="Maker" />
						<Avatar src="/assets/images/avatars/female-11.jpg" alt="Maker" />
						<Avatar src="/assets/images/avatars/male-09.jpg" alt="Maker" />
						<Avatar src="/assets/images/avatars/male-16.jpg" alt="Maker" />
					</AvatarGroup>
					<div>
						<Typography sx={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
							Trusted for custom gifts
						</Typography>
						<Typography sx={{ fontSize: 11.5, color: 'rgba(203, 213, 225, 0.7)' }}>
							Cups, kitchenware, apparel &amp; engraved keepsakes
						</Typography>
					</div>
				</div>

				<div className="hidden lg:inline-flex rounded-full bg-purple-400/15 border border-purple-300/25 px-3 py-1 text-xs font-semibold text-purple-100">
					Place Custom Order
				</div>
			</div>
		</Box>
	);
}

export default AuthPagesMessageSection;
