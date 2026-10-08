import Paper from '@mui/material/Paper';
import JwtSignUpTab from '../tabs/sign-up/JwSignUpTab';
import SignUpPageTitle from '../ui/SignUpPageTitle';
import AuthPagesMessageSection from '../ui/AuthPagesMessageSection';

/**
 * The sign up page.
 */
function SignUpPageView() {
	return (
		<div className="flex min-w-0 flex-auto flex-col items-center sm:flex-row sm:justify-center md:items-start md:justify-start">
			<Paper className="h-full w-full px-4 py-2 sm:h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm md:flex md:h-full md:w-1/2 md:items-center md:justify-end md:rounded-none md:p-16 md:shadow-none ltr:border-r-1 rtl:border-l-1">
				<div className="mx-auto flex w-full max-w-80 flex-col gap-8 sm:mx-0 sm:w-80">
					<SignUpPageTitle />
					<div>
						{/* <Tabs
							value={_.findIndex(tabs, { id: selectedTabId })}
							variant="fullWidth"
							className="mb-8 w-full"
							classes={{
								indicator: 'flex justify-center bg-transparent w-full h-full'
							}}
							TabIndicatorProps={{
								children: (
									<Box
										sx={{ borderColor: (theme) => theme.vars.palette.secondary.main }}
										className="h-full w-full rounded-lg border-1 border-solid"
									/>
								)
							}}
						>
							{tabs.map((item) => (
								<Tab
									disableRipple
									onClick={() => handleSelectTab(item.id)}
									key={item.id}
									icon={
										<img
											className={item.logoClass}
											src={item.logo}
											alt={item.title}
										/>
									}
									className="min-w-0"
									label={item.title}
								/>
							))}
						</Tabs> */}

						{/* {selectedTabId === "jwt" && <JwtSignUpTab />} */}
						<JwtSignUpTab />
					</div>
				</div>
			</Paper>

			<AuthPagesMessageSection />
		</div>
	);
}

export default SignUpPageView;
