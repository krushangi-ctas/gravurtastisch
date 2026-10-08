import FuseLayout from '@fuse/core/FuseLayout';
import { SnackbarProvider } from 'notistack';
import themeLayouts from 'src/components/theme-layouts/themeLayouts';
import FuseSettingsProvider from '@fuse/core/FuseSettings/FuseSettingsProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enUS } from 'date-fns/locale/en-US';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ErrorBoundary from '@fuse/utils/ErrorBoundary';
import Authentication from '@auth/Authentication';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainThemeProvider from '../contexts/MainThemeProvider';
import routes from '@/configs/routesConfig';
import AppContext from '@/contexts/AppContext';
import { FuseDialogContextProvider } from '@fuse/core/FuseDialog/contexts/FuseDialogContext/FuseDialogContextProvider';
import { NavbarContextProvider } from '@/components/theme-layouts/components/navbar/contexts/NavbarContext/NavbarContextProvider';
import { QuickPanelProvider } from '@/components/theme-layouts/components/quickPanel/contexts/QuickPanelContext/QuickPanelContextProvider';
import RootThemeProvider from '@/contexts/RootThemeProvider';
import { NavigationContextProvider } from '@/components/theme-layouts/components/navigation/contexts/NavigationContextProvider';
import ShadcnToast from '@/components/ui/ShadcnToast';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes
			retry: 1
		}
	}
});

/**
 * The main App component.
 */
function App() {
	const AppContextValue = {
		routes
	};

	return (
		<ErrorBoundary>
			<AppContext value={AppContextValue}>
				{/* Date Picker Localization Provider */}
				<LocalizationProvider
					dateAdapter={AdapterDateFns}
					adapterLocale={enUS}
				>
					<QueryClientProvider client={queryClient}>
						<Authentication>
							<FuseSettingsProvider>
								{/* Theme Provider */}
								<RootThemeProvider>
									<MainThemeProvider>
										<NavbarContextProvider>
											<NavigationContextProvider>
												<FuseDialogContextProvider>
													{/* Notistack Notification Provider with Shadcn UI Toast */}
													<SnackbarProvider
														maxSnack={5}
														anchorOrigin={{
															vertical: 'top',
															horizontal: 'right'
														}}
														Components={{
															default: ShadcnToast,
															success: ShadcnToast,
															error: ShadcnToast,
															warning: ShadcnToast,
															info: ShadcnToast
														}}
														classes={{
															containerRoot:
																'top-0 right-0 mt-4 mr-4 lg:mr-6 z-[9999]'
														}}
													>
														<QuickPanelProvider>
															<FuseLayout layouts={themeLayouts} />
														</QuickPanelProvider>
													</SnackbarProvider>
												</FuseDialogContextProvider>
											</NavigationContextProvider>
										</NavbarContextProvider>
									</MainThemeProvider>
								</RootThemeProvider>
							</FuseSettingsProvider>
						</Authentication>
						{/* <ReactQueryDevtools initialIsOpen={false} /> */}
					</QueryClientProvider>
				</LocalizationProvider>
			</AppContext>
		</ErrorBoundary>
	);
}

export default App;
