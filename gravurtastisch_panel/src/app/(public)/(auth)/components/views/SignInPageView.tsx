import JwtLoginTab from '../tabs/sign-in/JwtSignInTab';
import SignInPageTitle from '../ui/SignInPageTitle';
import AuthPagesMessageSection from '../ui/AuthPagesMessageSection';

/**
 * The sign in page.
 */
function SignInPageView() {
	return (
		<div className="flex min-h-screen w-full flex-col md:flex-row overflow-hidden">
			{/* Left Side: Sign In Form (Perfect Horizontal & Vertical Center with Card Border & Shadow) */}
			<div className="flex min-h-screen w-full flex-col justify-center items-center md:w-1/2 p-4 sm:p-8 md:p-10 lg:p-12 bg-slate-50/60">
				<div className="w-full max-w-[440px] flex flex-col justify-center bg-white rounded-2xl border border-slate-200/90 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08),0_4px_16px_-2px_rgba(0,0,0,0.04)] p-7 sm:p-9">
					<SignInPageTitle />
					<div className="mt-3">
						<JwtLoginTab />
					</div>
				</div>
			</div>

			{/* Right Side: Animated Hero Section (Symmetrically Aligned & Centered) */}
			<AuthPagesMessageSection />
		</div>
	);
}

export default SignInPageView;
