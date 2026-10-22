import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

const FEATURES = [
	{
		icon: 'heroicons-solid:photo',
		label: 'Photo Cups & Mugs',
		description: 'Full-wrap prints and heat-changing cups',
		accentColor: '#0032ab',
		badgeBg: 'rgba(0, 50, 171, 0.08)',
		borderColor: 'rgba(0, 50, 171, 0.22)'
	},
	{
		icon: 'heroicons-solid:sparkles',
		label: 'Laser Engraving',
		description: 'Boards, coasters, wallets & keepsakes',
		accentColor: '#7c3aed',
		badgeBg: 'rgba(124, 58, 237, 0.08)',
		borderColor: 'rgba(124, 58, 237, 0.22)'
	},
	{
		icon: 'heroicons-solid:shopping-bag',
		label: 'Custom Apparel',
		description: 'DTG prints, embroidery & tote bags',
		accentColor: '#059669',
		badgeBg: 'rgba(5, 150, 105, 0.08)',
		borderColor: 'rgba(5, 150, 105, 0.22)'
	},
	{
		icon: 'heroicons-solid:clipboard-document-check',
		label: 'Order Desk',
		description: 'Proofs, production & delivery in one place',
		accentColor: '#2563eb',
		badgeBg: 'rgba(37, 99, 235, 0.08)',
		borderColor: 'rgba(37, 99, 235, 0.22)'
	}
];

function AuthPagesMessageSection() {
	return (
		<Box
			className="relative hidden min-h-screen w-full flex-col justify-center overflow-hidden p-8 md:flex md:w-1/2 lg:px-16 lg:py-12 select-none"
			sx={{
				background: 'linear-gradient(180deg, #c6dbf2 0%, #d5e4f7 50%, #bfd6f0 100%)',
				color: '#00227a'
			}}
		>
			<div className="pointer-events-none absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full bg-[#0032ab]/12 blur-[100px]" />
			<div className="pointer-events-none absolute -bottom-20 -left-20 h-[380px] w-[380px] rounded-full bg-[#4f6ef7]/15 blur-[100px]" />
			<div className="pointer-events-none absolute top-1/2 right-1/4 h-[300px] w-[300px] rounded-full bg-white/40 blur-[80px]" />

			<Box
				component="svg"
				className="pointer-events-none absolute top-0 right-0"
				sx={{ color: '#0032ab', opacity: 0.12 }}
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
				<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0032ab]/20 bg-white/80 px-3.5 py-1.5 backdrop-blur-md self-start shadow-xs">
					<span className="relative flex h-2 w-2">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
						<span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
					</span>
					<span className="text-[11px] font-bold tracking-widest text-[#0032ab] uppercase">
						Custom Engraving Studio
					</span>
				</div>

				<Typography
					sx={{
						fontSize: { xs: 32, sm: 38, lg: 44 },
						fontWeight: 900,
						lineHeight: 1.15,
						letterSpacing: '-0.025em',
						color: '#00227a'
					}}
				>
					Photo cups, kitchenware &amp;{' '}
					<span className="bg-gradient-to-r from-[#0032ab] via-[#4f6ef7] to-[#155dfc] bg-clip-text text-transparent">
						engraved keepsakes
					</span>
				</Typography>

				<Typography
					sx={{
						mt: 2,
						fontSize: { xs: 14.5, sm: 15.5, lg: 16 },
						lineHeight: 1.6,
						color: '#334155',
						fontWeight: 500,
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
							className="group flex items-start gap-3.5 p-4 rounded-2xl bg-white/80 hover:bg-white border border-[#0032ab]/15 hover:border-[#0032ab]/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_24px_rgba(0,50,171,0.06)] hover:shadow-[0_16px_36px_rgba(0,50,171,0.14)]"
						>
							<div
								className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 shadow-xs"
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
										fontWeight: 800,
										lineHeight: 1.3,
										color: '#00227a'
									}}
								>
									{feature.label}
								</Typography>
								<Typography
									sx={{
										fontSize: 12,
										color: '#475569',
										fontWeight: 500,
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

				<div className="mt-4 flex items-center justify-between rounded-xl border border-[#0032ab]/20 bg-white/75 px-4 py-2.5 backdrop-blur-md shadow-xs">
					<div className="flex items-center gap-2">
						<span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
						<span className="text-xs font-bold text-slate-700">
							Free digital proof on custom orders
						</span>
					</div>
					<div className="flex items-center gap-1.5 text-xs font-bold text-[#0032ab]">
						<span>Handcrafted</span>
						<span className="text-slate-500 ml-1">with precision</span>
					</div>
				</div>
			</div>
		</Box>
	);
}

export default AuthPagesMessageSection;
