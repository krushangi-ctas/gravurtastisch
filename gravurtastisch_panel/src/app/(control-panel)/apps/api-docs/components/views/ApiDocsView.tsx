import { useEffect, useRef, useState, useMemo } from 'react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { baseBackendApiUrl } from '@/utils/apiFetch';

declare const window: any;

interface HighlightItem {
	label: string;
	value: string;
}

interface KeyField {
	name: string;
	description: string;
}

interface ModelDoc {
	id: string;
	title: string;
	shortTitle: string;
	overview: string;
	purpose: string;
	badge: string;
	highlights: HighlightItem[];
	interfaceCode: string;
	keyFields: KeyField[];
	notes: string[];
}

interface MiddlewareDoc {
	id: string;
	title: string;
	overview: string;
	code: string;
	notes: string[];
	highlights: HighlightItem[];
}

interface UtilityDoc {
	id: string;
	title: string;
	overview: string;
	code: string;
	notes: string[];
	highlights: HighlightItem[];
}

interface PluginDoc {
	id: string;
	title: string;
	overview: string;
	code: string;
	notes: string[];
	highlights: HighlightItem[];
}

interface ConfigEntry {
	key: string;
	description: string;
}

interface ConfigGroup {
	title: string;
	summary: string;
	entries: ConfigEntry[];
}

interface ConfigurationData {
	serverPort: string;
	environment: string;
	authWindow: string;
	groups: ConfigGroup[];
}

interface TechnicalDocData {
	models: ModelDoc[];
	middlewares: MiddlewareDoc[];
	utilities: UtilityDoc[];
	plugins: PluginDoc[];
	configuration: ConfigurationData;
}

function ApiDocsView() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [docData, setDocData] = useState<TechnicalDocData | null>(null);
	const [selectedSection, setSelectedSection] = useState<'api-docs' | 'models' | 'middlewares' | 'utilities' | 'plugins' | 'configuration'>('api-docs');
	const [selectedChildId, setSelectedChildId] = useState<string>('');
	// Default: expand all sections so all 14 models, 7 middlewares, 6 utilities, 3 plugins are immediately visible
	const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
		models: true,
		middlewares: true,
		utilities: true,
		plugins: true
	});
	const [activeTab, setActiveTab] = useState<'both' | 'docs' | 'code'>('both');
	const [searchQuery, setSearchQuery] = useState('');
	const [copied, setCopied] = useState(false);
	const [copiedKey, setCopiedKey] = useState<string | null>(null);
	const [propertySearchQuery, setPropertySearchQuery] = useState('');
	const redocInitialized = useRef(false);

	const toggleFullscreen = () => {
		setIsFullscreen((prev) => !prev);
	};

	const toggleExpand = (sectionKey: string, e?: React.MouseEvent) => {
		if (e) e.stopPropagation();
		setExpandedSections((prev) => ({
			...prev,
			[sectionKey]: !prev[sectionKey]
		}));
	};

	const selectSectionWithExpand = (sectionKey: typeof selectedSection, defaultChildId?: string) => {
		setSelectedSection(sectionKey);
		setExpandedSections((prev) => ({
			...prev,
			[sectionKey]: true
		}));
		if (defaultChildId) {
			setSelectedChildId(defaultChildId);
		}
	};

	// Copy Code to Clipboard
	const copyCode = (code: string) => {
		if (!code) return;
		navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	// Copy single token/key to clipboard
	const copyText = (text: string, keyId: string) => {
		if (!text) return;
		navigator.clipboard.writeText(text);
		setCopiedKey(keyId);
		setTimeout(() => setCopiedKey(null), 1800);
	};

	// Load Technical Sections Data
	useEffect(() => {
		fetch('/api-docs/technical-doc-sections.json')
			.then((res) => {
				if (!res.ok) throw new Error('Failed to load technical doc sections data');
				return res.json();
			})
			.then((data: TechnicalDocData) => {
				setDocData(data);
			})
			.catch((err) => {
				console.warn('Could not load technical-doc-sections.json:', err);
			});
	}, []);

	// Initialize ReDoc when in api-docs section
	useEffect(() => {
		if (selectedSection !== 'api-docs') return;

		let isMounted = true;
		let checkTimer: any = null;
		let attempts = 0;

		const initRedoc = async () => {
			if (!containerRef.current) return;

			if (typeof window === 'undefined' || !window.Redoc) {
				if (attempts < 30) {
					attempts++;
					checkTimer = setTimeout(initRedoc, 200);
				} else {
					if (isMounted) {
						setIsLoading(false);
						setLoadError('Failed to load ReDoc documentation engine. Please verify your connection.');
					}
				}
				return;
			}

			if (redocInitialized.current && containerRef.current.children.length > 0) {
				if (isMounted) setIsLoading(false);
				return;
			}

			try {
				let spec: any = null;
				try {
					const res = await fetch('/api-docs/openapi.json');
					if (res.ok) spec = await res.json();
				} catch (e) {
					console.warn('Local /api-docs/openapi.json failed, falling back to backend');
				}

				if (!spec) {
					const backendDocsUrl = `${baseBackendApiUrl.replace(/\/v1\/?$/, '')}/v1/docs/openapi.json`;
					const fallbackRes = await fetch(backendDocsUrl);
					if (!fallbackRes.ok) throw new Error(`HTTP ${fallbackRes.status} loading OpenAPI spec`);
					spec = await fallbackRes.json();
				}

				if (!isMounted || !containerRef.current) return;

				containerRef.current.innerHTML = '';

				window.Redoc.init(
					spec,
					{
						scrollYOffset: 48,
						hideHostname: false,
						hideDownloadButton: true,
						expandResponses: '200,201',
						pathInMiddlePanel: true,
						requiredPropsFirst: true,
						sortPropsAlphabetically: false,
						theme: {
							colors: {
								primary: {
									main: '#0032ab'
								},
								success: {
									main: '#16a34a'
								},
								responses: {
									success: {
										color: '#16a34a',
										backgroundColor: 'rgba(220, 38, 38, 0.05)'
									},
									error: {
										color: '#dc2626',
										backgroundColor: 'rgba(220, 38, 38, 0.05)'
									}
								}
							},
							typography: {
								fontSize: '14px',
								fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
								headings: {
									fontFamily: 'Inter, sans-serif',
									fontWeight: '700'
								},
								code: {
									fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
									fontSize: '13px'
								}
							},
							sidebar: {
								backgroundColor: '#f8fafc',
								textColor: '#1e293b',
								activeTextColor: '#0032ab',
								width: '280px'
							},
							rightPanel: {
								backgroundColor: '#0f172a',
								textColor: '#f8fafc',
								width: '42%'
							}
						}
					},
					containerRef.current
				);

				redocInitialized.current = true;
				if (isMounted) setIsLoading(false);
			} catch (err: any) {
				console.error('Redoc initialization error:', err);
				if (isMounted) {
					setIsLoading(false);
					setLoadError(err?.message || 'Error initializing OpenAPI documentation.');
				}
			}
		};

		// Clean up any stray host prefix before {baseurl}
		let observer: MutationObserver | null = null;
		if (containerRef.current) {
			const cleanBaseUrl = () => {
				if (!containerRef.current) return;
				const nodes = containerRef.current.querySelectorAll('*');
				nodes.forEach((el) => {
					if (el.children.length === 0 && el.textContent && el.textContent.includes('{baseurl}')) {
						const cleaned = el.textContent.replace(/https?:\/\/[^/]+\/[^{]*\{baseurl\}/g, '{baseurl}');
						if (cleaned !== el.textContent) {
							el.textContent = cleaned;
						}
					}
				});
			};
			observer = new MutationObserver(cleanBaseUrl);
			observer.observe(containerRef.current, { childList: true, subtree: true, characterData: true });
		}

		initRedoc();

		return () => {
			isMounted = false;
			if (checkTimer) clearTimeout(checkTimer);
			if (observer) observer.disconnect();
		};
	}, [selectedSection]);

	// Filtered lists for search
	const filteredModels = useMemo(() => {
		if (!docData?.models) return [];
		if (!searchQuery.trim()) return docData.models;
		const q = searchQuery.toLowerCase();
		return docData.models.filter((m) => m.title.toLowerCase().includes(q) || m.shortTitle.toLowerCase().includes(q) || m.badge.toLowerCase().includes(q));
	}, [docData, searchQuery]);

	const filteredMiddlewares = useMemo(() => {
		if (!docData?.middlewares) return [];
		if (!searchQuery.trim()) return docData.middlewares;
		const q = searchQuery.toLowerCase();
		return docData.middlewares.filter((m) => m.title.toLowerCase().includes(q) || m.overview.toLowerCase().includes(q));
	}, [docData, searchQuery]);

	const filteredUtilities = useMemo(() => {
		if (!docData?.utilities) return [];
		if (!searchQuery.trim()) return docData.utilities;
		const q = searchQuery.toLowerCase();
		return docData.utilities.filter((u) => u.title.toLowerCase().includes(q) || u.overview.toLowerCase().includes(q));
	}, [docData, searchQuery]);

	const filteredPlugins = useMemo(() => {
		if (!docData?.plugins) return [];
		if (!searchQuery.trim()) return docData.plugins;
		const q = searchQuery.toLowerCase();
		return docData.plugins.filter((p) => p.title.toLowerCase().includes(q) || p.overview.toLowerCase().includes(q));
	}, [docData, searchQuery]);

	// Active Item Selected
	const activeModel = useMemo(() => {
		if (!docData?.models?.length) return null;
		return docData.models.find((m) => m.id === selectedChildId) || docData.models[0];
	}, [docData, selectedChildId]);

	const activeMiddleware = useMemo(() => {
		if (!docData?.middlewares?.length) return null;
		return docData.middlewares.find((m) => m.id === selectedChildId) || docData.middlewares[0];
	}, [docData, selectedChildId]);

	const activeUtility = useMemo(() => {
		if (!docData?.utilities?.length) return null;
		return docData.utilities.find((u) => u.id === selectedChildId) || docData.utilities[0];
	}, [docData, selectedChildId]);

	const activePlugin = useMemo(() => {
		if (!docData?.plugins?.length) return null;
		return docData.plugins.find((p) => p.id === selectedChildId) || docData.plugins[0];
	}, [docData, selectedChildId]);

	const activeCode = useMemo(() => {
		if (selectedSection === 'models') return activeModel?.interfaceCode || '';
		if (selectedSection === 'middlewares') return activeMiddleware?.code || '';
		if (selectedSection === 'utilities') return activeUtility?.code || '';
		if (selectedSection === 'plugins') return activePlugin?.code || '';
		return '';
	}, [selectedSection, activeModel, activeMiddleware, activeUtility, activePlugin]);

	const activeCodeLines = useMemo(() => {
		if (!activeCode) return [];
		return activeCode.split('\n');
	}, [activeCode]);

	const filteredKeyFields = useMemo(() => {
		if (!activeModel?.keyFields) return [];
		if (!propertySearchQuery.trim()) return activeModel.keyFields;
		const q = propertySearchQuery.toLowerCase();
		return activeModel.keyFields.filter(
			(f) => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
		);
	}, [activeModel, propertySearchQuery]);

	// Current list and pagination index
	const currentList = useMemo(() => {
		if (selectedSection === 'models') return docData?.models || [];
		if (selectedSection === 'middlewares') return docData?.middlewares || [];
		if (selectedSection === 'utilities') return docData?.utilities || [];
		if (selectedSection === 'plugins') return docData?.plugins || [];
		return [];
	}, [selectedSection, docData]);

	const currentIndex = useMemo(() => {
		if (!currentList.length) return 0;
		const idx = currentList.findIndex((item) => item.id === selectedChildId);
		return idx >= 0 ? idx : 0;
	}, [currentList, selectedChildId]);

	const goToNext = () => {
		if (currentIndex < currentList.length - 1) {
			setSelectedChildId(currentList[currentIndex + 1].id);
		}
	};

	const goToPrev = () => {
		if (currentIndex > 0) {
			setSelectedChildId(currentList[currentIndex - 1].id);
		}
	};

	return (
		<div className={`flex flex-col w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-50 dark:bg-slate-900 ${isFullscreen ? 'fixed inset-0 z-99999 bg-white' : ''}`}>
			{/* Scoped CSS for sticky Redoc menu */}
			<style>{`
				#gravurtastisch-redoc-container {
					position: relative;
				}
				#gravurtastisch-redoc-container .menu-content {
					position: sticky !important;
					top: 0px !important;
					height: calc(100vh - 65px) !important;
					max-height: calc(100vh - 65px) !important;
					overflow-y: auto !important;
					z-index: 10 !important;
					align-self: flex-start !important;
				}
				#gravurtastisch-redoc-container .redoc-wrap {
					display: flex !important;
					position: relative !important;
				}
			`}</style>

			{/* Top Header Bar (Fixed / Shrink-0) */}
			<div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs z-30">
				<div className="flex items-center gap-3.5">
					<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xs">
						<FuseSvgIcon size={22}>lucide:book-open</FuseSvgIcon>
					</div>
					<div>
						<div className="flex items-center gap-2.5">
							<h1 className="text-lg font-bold text-slate-900 dark:text-white m-0 tracking-tight">
								Technical Documentation
							</h1>
							<span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-semibold border border-slate-300 dark:border-slate-700">
								v1.0.0
							</span>
						</div>
						<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 m-0 font-medium mt-0.5">
							Interactive REST APIs, Mongoose Schemas, Middlewares, Utilities & System Architecture
						</p>
					</div>
				</div>

				{/* Quick Actions */}
				<div className="flex items-center gap-2">
					<Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
						<Button
							variant="outlined"
							size="small"
							onClick={toggleFullscreen}
							className="min-w-0 p-2 rounded-lg border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
						>
							<FuseSvgIcon size={18}>{isFullscreen ? 'lucide:minimize-2' : 'lucide:maximize-2'}</FuseSvgIcon>
						</Button>
					</Tooltip>
				</div>
			</div>

			{/* Main Layout: Fixed height flex container preventing page scroll */}
			<div className="flex flex-1 flex-col lg:flex-row min-w-0 min-h-0 h-[calc(100dvh-65px)] overflow-hidden">
				{/* Left Sidebar Navigation: Permanently sticky / fixed h-full, never scrolls away */}
				<aside className="w-full lg:w-75 shrink-0 h-full border-r border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col min-h-0 overflow-hidden">
					{/* Search Box: text-[13px] matching main navigation */}
					<div className="p-3 border-b border-slate-100 dark:border-slate-800">
						<div className="relative">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search docs, models & modules..."
								className="w-full pl-9 pr-3 py-2 text-[13px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-medium"
							/>
							<div className="absolute left-3 top-2.5 text-slate-400">
								<FuseSvgIcon size={16}>lucide:search</FuseSvgIcon>
							</div>
						</div>
					</div>

					{/* Navigation List: Exact text-[13px] font-medium consistent with main panel navigation */}
					<div className="flex-1 overflow-y-auto p-2.5 space-y-1 text-[13px]">
						{/* 1. API Documentation */}
						<button
							type="button"
							onClick={() => selectSectionWithExpand('api-docs')}
							className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
								selectedSection === 'api-docs'
									? 'bg-blue-50/90 dark:bg-blue-950/40 text-[#0032ab] dark:text-blue-300 font-semibold border-l-4 border-l-[#0032ab] dark:border-l-blue-400 shadow-2xs'
									: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
							}`}
						>
							<div className="flex items-center gap-3">
								<FuseSvgIcon size={20} className={selectedSection === 'api-docs' ? 'text-[#0032ab] dark:text-blue-400' : 'text-slate-500'}>
									lucide:book-open
								</FuseSvgIcon>
								<span>API Documentation</span>
							</div>
							<span className={`text-[11px] px-2 py-0.5 rounded font-mono font-semibold ${
								selectedSection === 'api-docs'
									? 'bg-blue-100 dark:bg-blue-900/50 text-[#0032ab] dark:text-blue-300'
									: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
							}`}>
								REST
							</span>
						</button>

						{/* 2. Models (Mongoose Schemas) */}
						<div>
							<button
								type="button"
								onClick={() => selectSectionWithExpand('models', filteredModels[0]?.id)}
								className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
									selectedSection === 'models'
										? 'bg-blue-50/90 dark:bg-blue-950/40 text-[#0032ab] dark:text-blue-300 font-semibold border-l-4 border-l-[#0032ab] dark:border-l-blue-400 shadow-2xs'
										: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
								}`}
							>
								<div className="flex items-center gap-3">
									<FuseSvgIcon size={20} className={selectedSection === 'models' ? 'text-[#0032ab] dark:text-blue-400' : 'text-slate-500'}>
										lucide:database
									</FuseSvgIcon>
									<span>Models ({filteredModels.length})</span>
								</div>
								<span
									onClick={(e) => toggleExpand('models', e)}
									className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
								>
									{expandedSections.models ? '−' : '+'}
								</span>
							</button>

							{/* Model Sub-items: ALL 14 shown clearly! */}
							{expandedSections.models && (
								<div className="ml-4 mt-1 pl-2.5 border-l-2 border-slate-200 dark:border-slate-700 space-y-0.5 max-h-64 overflow-y-auto">
									{filteredModels.map((model) => {
										const isSelected = selectedSection === 'models' && (selectedChildId === model.id || (!selectedChildId && model.id === filteredModels[0]?.id));
										return (
											<button
												key={model.id}
												type="button"
												onClick={() => {
													setSelectedSection('models');
													setSelectedChildId(model.id);
												}}
												className={`w-full text-left px-2.5 py-1.5 rounded-md text-[13px] transition-all flex items-center justify-between ${
													isSelected
														? 'bg-blue-50 dark:bg-blue-950/50 text-[#0032ab] dark:text-blue-300 font-semibold border-l-2 border-l-[#0032ab]'
														: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 font-medium'
												}`}
											>
												<span className="truncate">{model.shortTitle}</span>
												<span className={`text-[11px] font-mono truncate max-w-[85px] px-1 py-0.2 rounded ${
													isSelected
														? 'bg-blue-100 dark:bg-blue-900/60 text-[#0032ab] dark:text-blue-300'
														: 'bg-slate-100 dark:bg-slate-800 text-slate-400'
												}`}>
													{model.badge.replace('tbl_', '')}
												</span>
											</button>
										);
									})}
								</div>
							)}
						</div>

						{/* 3. Middlewares: ALL 7 shown clearly! */}
						<div>
							<button
								type="button"
								onClick={() => selectSectionWithExpand('middlewares', filteredMiddlewares[0]?.id)}
								className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
									selectedSection === 'middlewares'
										? 'bg-blue-50/90 dark:bg-blue-950/40 text-[#0032ab] dark:text-blue-300 font-semibold border-l-4 border-l-[#0032ab] dark:border-l-blue-400 shadow-2xs'
										: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
								}`}
							>
								<div className="flex items-center gap-3">
									<FuseSvgIcon size={20} className={selectedSection === 'middlewares' ? 'text-[#0032ab] dark:text-blue-400' : 'text-slate-500'}>
										lucide:shield-check
									</FuseSvgIcon>
									<span>Middlewares ({filteredMiddlewares.length})</span>
								</div>
								<span
									onClick={(e) => toggleExpand('middlewares', e)}
									className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
								>
									{expandedSections.middlewares ? '−' : '+'}
								</span>
							</button>

							{/* Middleware Sub-items: ALL 7 shown! */}
							{expandedSections.middlewares && (
								<div className="ml-4 mt-1 pl-2.5 border-l-2 border-slate-200 dark:border-slate-700 space-y-0.5 max-h-64 overflow-y-auto">
									{filteredMiddlewares.map((mw) => {
										const isSelected = selectedSection === 'middlewares' && (selectedChildId === mw.id || (!selectedChildId && mw.id === filteredMiddlewares[0]?.id));
										return (
											<button
												key={mw.id}
												type="button"
												onClick={() => {
													setSelectedSection('middlewares');
													setSelectedChildId(mw.id);
												}}
												className={`w-full text-left px-2.5 py-1.5 rounded-md text-[13px] transition-all flex items-center justify-between ${
													isSelected
														? 'bg-blue-50 dark:bg-blue-950/50 text-[#0032ab] dark:text-blue-300 font-semibold border-l-2 border-l-[#0032ab]'
														: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 font-medium'
												}`}
											>
												<span className="truncate">{mw.title}</span>
											</button>
										);
									})}
								</div>
							)}
						</div>

						{/* 4. Utilities: ALL 6 shown clearly! */}
						<div>
							<button
								type="button"
								onClick={() => selectSectionWithExpand('utilities', filteredUtilities[0]?.id)}
								className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
									selectedSection === 'utilities'
										? 'bg-blue-50/90 dark:bg-blue-950/40 text-[#0032ab] dark:text-blue-300 font-semibold border-l-4 border-l-[#0032ab] dark:border-l-blue-400 shadow-2xs'
										: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
								}`}
							>
								<div className="flex items-center gap-3">
									<FuseSvgIcon size={20} className={selectedSection === 'utilities' ? 'text-[#0032ab] dark:text-blue-400' : 'text-slate-500'}>
										lucide:wrench
									</FuseSvgIcon>
									<span>Utilities ({filteredUtilities.length})</span>
								</div>
								<span
									onClick={(e) => toggleExpand('utilities', e)}
									className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
								>
									{expandedSections.utilities ? '−' : '+'}
								</span>
							</button>

							{/* Utility Sub-items: ALL 6 shown! */}
							{expandedSections.utilities && (
								<div className="ml-4 mt-1 pl-2.5 border-l-2 border-slate-200 dark:border-slate-700 space-y-0.5 max-h-64 overflow-y-auto">
									{filteredUtilities.map((u) => {
										const isSelected = selectedSection === 'utilities' && (selectedChildId === u.id || (!selectedChildId && u.id === filteredUtilities[0]?.id));
										return (
											<button
												key={u.id}
												type="button"
												onClick={() => {
													setSelectedSection('utilities');
													setSelectedChildId(u.id);
												}}
												className={`w-full text-left px-2.5 py-1.5 rounded-md text-[13px] transition-all flex items-center justify-between ${
													isSelected
														? 'bg-blue-50 dark:bg-blue-950/50 text-[#0032ab] dark:text-blue-300 font-semibold border-l-2 border-l-[#0032ab]'
														: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 font-medium'
												}`}
											>
												<span className="truncate">{u.title}</span>
											</button>
										);
									})}
								</div>
							)}
						</div>

						{/* 5. Plugins: ALL 3 shown clearly! */}
						<div>
							<button
								type="button"
								onClick={() => selectSectionWithExpand('plugins', filteredPlugins[0]?.id)}
								className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
									selectedSection === 'plugins'
										? 'bg-blue-50/90 dark:bg-blue-950/40 text-[#0032ab] dark:text-blue-300 font-semibold border-l-4 border-l-[#0032ab] dark:border-l-blue-400 shadow-2xs'
										: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
								}`}
							>
								<div className="flex items-center gap-3">
									<FuseSvgIcon size={20} className={selectedSection === 'plugins' ? 'text-[#0032ab] dark:text-blue-400' : 'text-slate-500'}>
										lucide:puzzle
									</FuseSvgIcon>
									<span>Plugins ({filteredPlugins.length})</span>
								</div>
								<span
									onClick={(e) => toggleExpand('plugins', e)}
									className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
								>
									{expandedSections.plugins ? '−' : '+'}
								</span>
							</button>

							{/* Plugin Sub-items: ALL 3 shown! */}
							{expandedSections.plugins && (
								<div className="ml-4 mt-1 pl-2.5 border-l-2 border-slate-200 dark:border-slate-700 space-y-0.5 max-h-64 overflow-y-auto">
									{filteredPlugins.map((p) => {
										const isSelected = selectedSection === 'plugins' && (selectedChildId === p.id || (!selectedChildId && p.id === filteredPlugins[0]?.id));
										return (
											<button
												key={p.id}
												type="button"
												onClick={() => {
													setSelectedSection('plugins');
													setSelectedChildId(p.id);
												}}
												className={`w-full text-left px-2.5 py-1.5 rounded-md text-[13px] transition-all flex items-center justify-between ${
													isSelected
														? 'bg-blue-50 dark:bg-blue-950/50 text-[#0032ab] dark:text-blue-300 font-semibold border-l-2 border-l-[#0032ab]'
														: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 font-medium'
												}`}
											>
												<span className="truncate">{p.title}</span>
											</button>
										);
									})}
								</div>
							)}
						</div>

						{/* 6. Configuration */}
						<button
							type="button"
							onClick={() => selectSectionWithExpand('configuration')}
							className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
								selectedSection === 'configuration'
									? 'bg-blue-50/90 dark:bg-blue-950/40 text-[#0032ab] dark:text-blue-300 font-semibold border-l-4 border-l-[#0032ab] dark:border-l-blue-400 shadow-2xs'
									: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
							}`}
						>
							<div className="flex items-center gap-3">
								<FuseSvgIcon size={20} className={selectedSection === 'configuration' ? 'text-[#0032ab] dark:text-blue-400' : 'text-slate-500'}>
									lucide:settings
								</FuseSvgIcon>
								<span>Configuration</span>
							</div>
							<span className={`text-[11px] px-2 py-0.5 rounded font-mono font-semibold ${
								selectedSection === 'configuration'
									? 'bg-blue-100 dark:bg-blue-900/50 text-[#0032ab] dark:text-blue-300'
									: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
							}`}>
								ENV
							</span>
						</button>
					</div>
				</aside>

				{/* Main Content Area: Constrained h-full so window never scrolls */}
				<main className="flex-1 h-full flex flex-col min-w-0 min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
					{/* ============================================================== */}
					{/* 1. API DOCUMENTATION VIEW (REDOC) */}
					{/* ============================================================== */}
					{selectedSection === 'api-docs' && (
						<div className="w-full flex-1 h-full min-h-0 flex flex-col overflow-y-auto">
							{isLoading && (
								<div className="flex flex-col items-center justify-center py-28 px-4 text-center">
									<CircularProgress size={40} thickness={4} className="text-slate-800 mb-4" />
									<h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 m-0">
										Loading Interactive OpenAPI Reference...
									</h3>
									<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
										Mounting ReDoc OpenAPI specification with realistic request & response samples
									</p>
								</div>
							)}

							{loadError && (
								<div className="m-6 p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-800 dark:text-rose-200">
									<div className="flex items-center gap-2.5 font-bold text-base">
										<FuseSvgIcon size={20}>lucide:alert-triangle</FuseSvgIcon>
										<span>Unable to load API Documentation</span>
									</div>
									<p className="text-sm mt-1.5 text-rose-700 dark:text-rose-300">{loadError}</p>
									<Button
										variant="contained"
										size="medium"
										onClick={() => window.location.reload()}
										className="mt-3.5 bg-rose-600 hover:bg-rose-700 text-white normal-case text-sm font-semibold rounded-lg"
									>
										Reload Page
									</Button>
								</div>
							)}

							<div
								ref={containerRef}
								id="gravurtastisch-redoc-container"
								className="w-full bg-white"
							/>
						</div>
					)}

					{/* ============================================================== */}
					{/* 2. DUAL-PANE / TABBED DETAIL VIEW (MODELS, MIDDLEWARES, UTILITIES, PLUGINS) */}
					{/* ============================================================== */}
					{selectedSection !== 'api-docs' && selectedSection !== 'configuration' && (
						<div className="flex flex-col flex-1 h-full min-h-0 min-w-0 overflow-hidden">
							{/* Sub-header with Category, Item Selector, and View Mode Toggle: Glassmorphic Web App Bar */}
							<div className="shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.3)] z-10">
								{/* Navigation breadcrumbs + item index */}
								<div className="flex items-center gap-3 text-sm">
									<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/70 text-[#0032ab] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 shadow-2xs">
										{selectedSection.toUpperCase()}
									</span>
									<span className="text-slate-300 dark:text-slate-600 font-light">/</span>
									<span className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
										{selectedSection === 'models' && activeModel?.shortTitle}
										{selectedSection === 'middlewares' && activeMiddleware?.title}
										{selectedSection === 'utilities' && activeUtility?.title}
										{selectedSection === 'plugins' && activePlugin?.title}
									</span>
									<span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200/80 dark:border-slate-700">
										{currentIndex + 1} of {currentList.length}
									</span>
								</div>

								{/* Controls: Prev / Next + View Mode */}
								<div className="flex items-center gap-2.5">
									<Button
										variant="outlined"
										size="small"
										disabled={currentIndex === 0}
										onClick={goToPrev}
										className="normal-case text-xs font-semibold px-3 py-1.5 rounded-lg border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs transition-all flex items-center gap-1.5"
									>
										<FuseSvgIcon size={14}>lucide:chevron-left</FuseSvgIcon>
										<span>Previous</span>
									</Button>
									<Button
										variant="outlined"
										size="small"
										disabled={currentIndex >= currentList.length - 1}
										onClick={goToNext}
										className="normal-case text-xs font-semibold px-3 py-1.5 rounded-lg border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs transition-all flex items-center gap-1.5"
									>
										<span>Next</span>
										<FuseSvgIcon size={14}>lucide:chevron-right</FuseSvgIcon>
									</Button>

									<div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

									{/* View Mode Toggle: Web app segmented control */}
									<div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl text-xs font-semibold border border-slate-200/70 dark:border-slate-700/60 shadow-inner">
										<button
											type="button"
											onClick={() => setActiveTab('both')}
											className={`px-3 py-1.5 rounded-lg transition-all ${
												activeTab === 'both'
													? 'bg-white dark:bg-slate-900 text-[#0032ab] dark:text-blue-300 shadow-xs font-bold'
													: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
											}`}
										>
											Split
										</button>
										<button
											type="button"
											onClick={() => setActiveTab('docs')}
											className={`px-3 py-1.5 rounded-lg transition-all ${
												activeTab === 'docs'
													? 'bg-white dark:bg-slate-900 text-[#0032ab] dark:text-blue-300 shadow-xs font-bold'
													: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
											}`}
										>
											Specs
										</button>
										<button
											type="button"
											onClick={() => setActiveTab('code')}
											className={`px-3 py-1.5 rounded-lg transition-all ${
												activeTab === 'code'
													? 'bg-white dark:bg-slate-900 text-[#0032ab] dark:text-blue-300 shadow-xs font-bold'
													: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
											}`}
										>
											Source
										</button>
									</div>
								</div>
							</div>

							{/* Dual-pane / Grid Body: strictly constrained h-full overflow-hidden */}
							<div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 min-w-0 h-full overflow-hidden">
								{/* Left Pane: Documentation & Specs with web app depth & shadow */}
								{(activeTab === 'both' || activeTab === 'docs') && (
									<div className={`${activeTab === 'both' ? 'lg:col-span-7' : 'lg:col-span-12'} relative p-6 sm:p-8 h-full overflow-y-auto space-y-6 bg-slate-50/70 dark:bg-[#070b14] border-r border-slate-200/80 dark:border-slate-800`}>
										{/* Ambient brand radial glow effects */}
										<div className="absolute top-0 right-10 w-96 h-96 bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
										<div className="absolute bottom-20 left-10 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

										{/* Banner Header: Card with multi-layer shadow and ambient top gradient */}
										<div className="relative overflow-hidden bg-white dark:bg-slate-900/90 p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-[0_16px_40px_-12px_rgba(0,50,171,0.08),0_4px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7),0_0_24px_rgba(0,50,171,0.12)]">
											{/* Top ambient brand line */}
											<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0032ab] via-blue-500 to-indigo-500" />

											<div className="flex flex-wrap items-start justify-between gap-3">
												<div>
													<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/70 text-[#0032ab] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 shadow-2xs">
														<span className="w-2 h-2 rounded-full bg-[#0032ab] dark:bg-blue-400 animate-pulse" />
														{selectedSection === 'models' && 'Mongoose Schema Definition'}
														{selectedSection === 'middlewares' && 'Express Guard / Interceptor'}
														{selectedSection === 'utilities' && 'Backend Utility Class'}
														{selectedSection === 'plugins' && 'Mongoose Schema Plugin'}
													</span>
													<h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3 m-0 tracking-tight">
														{selectedSection === 'models' && activeModel?.title}
														{selectedSection === 'middlewares' && activeMiddleware?.title}
														{selectedSection === 'utilities' && activeUtility?.title}
														{selectedSection === 'plugins' && activePlugin?.title}
													</h2>
													<p className="text-base text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed m-0">
														{selectedSection === 'models' && activeModel?.overview}
														{selectedSection === 'middlewares' && activeMiddleware?.overview}
														{selectedSection === 'utilities' && activeUtility?.overview}
														{selectedSection === 'plugins' && activePlugin?.overview}
													</p>
													{selectedSection === 'models' && activeModel?.purpose && (
														<div className="p-3.5 bg-gradient-to-r from-blue-50/50 via-white to-slate-50/50 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/60 rounded-xl border border-blue-100/80 dark:border-slate-800/80 mt-3.5 flex items-start gap-2.5 shadow-2xs">
															<FuseSvgIcon size={18} className="text-[#0032ab] dark:text-blue-400 shrink-0 mt-0.5">lucide:sparkles</FuseSvgIcon>
															<p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 font-medium m-0 leading-relaxed">
																{activeModel.purpose}
															</p>
														</div>
													)}
												</div>

												{selectedSection === 'models' && activeModel?.badge && (
													<span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-900 text-white dark:bg-slate-800 dark:text-blue-200 shadow-sm border border-slate-700/60">
														{activeModel.badge}
													</span>
												)}
											</div>

											{/* Highlights Cards: Modern floating stat tiles */}
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
												{(selectedSection === 'models' ? activeModel?.highlights : selectedSection === 'middlewares' ? activeMiddleware?.highlights : selectedSection === 'utilities' ? activeUtility?.highlights : activePlugin?.highlights)?.map((h, i) => {
													const colors = [
														'border-l-blue-500 text-[#0032ab] dark:text-blue-400',
														'border-l-emerald-500 text-emerald-600 dark:text-emerald-400',
														'border-l-indigo-500 text-indigo-600 dark:text-indigo-400',
														'border-l-amber-500 text-amber-600 dark:text-amber-400'
													];
													const accent = colors[i % colors.length];
													return (
														<div key={i} className={`bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 border-l-4 ${accent} shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 hover:-translate-y-0.5`}>
															<div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{h.label}</div>
															<div className="text-[13.5px] font-bold text-slate-900 dark:text-white mt-1 break-words">{h.value}</div>
														</div>
													);
												})}
											</div>
										</div>

										{/* Key Fields (For Models): Elevated Web Card with Search & Row Copy Effects */}
										{selectedSection === 'models' && activeModel && activeModel.keyFields?.length > 0 && (
											<div className="bg-white dark:bg-slate-900/90 p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-[0_16px_40px_-12px_rgba(0,50,171,0.06),0_4px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]">
												<div className="flex flex-wrap items-center justify-between gap-3 mb-5">
													<div className="flex items-center gap-3">
														<div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-[#0032ab] dark:text-blue-300 flex items-center justify-center font-bold shadow-2xs border border-blue-200/60">
															<FuseSvgIcon size={16} className="text-[#0032ab] dark:text-blue-300">lucide:database</FuseSvgIcon>
														</div>
														<div>
															<h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 m-0">
																Key Schema Properties & Indexes
															</h3>
															<span className="text-xs text-slate-400 dark:text-slate-500">
																Showing {filteredKeyFields.length} of {activeModel.keyFields.length} properties
															</span>
														</div>
													</div>

													{/* Quick Property Search */}
													<div className="relative">
														<input
															type="text"
															value={propertySearchQuery}
															onChange={(e) => setPropertySearchQuery(e.target.value)}
															placeholder="Filter properties..."
															className="w-48 sm:w-56 px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0032ab] shadow-inner"
														/>
														{propertySearchQuery && (
															<button
																type="button"
																onClick={() => setPropertySearchQuery('')}
																className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
															>
																✕
															</button>
														)}
													</div>
												</div>

												<div className="space-y-2.5">
													{filteredKeyFields.map((field, idx) => {
														const isKeyCopied = copiedKey === `prop-${idx}`;
														return (
															<div
																key={idx}
																className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 hover:border-blue-200/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 shadow-2xs group"
															>
																<div className="flex items-center gap-2.5 min-w-[200px] shrink-0">
																	<code className="font-mono font-bold text-xs sm:text-sm text-[#0032ab] dark:text-blue-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
																		{field.name}
																	</code>
																	<button
																		type="button"
																		onClick={() => copyText(field.name, `prop-${idx}`)}
																		className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-[#0032ab] dark:hover:text-blue-300"
																		title="Copy property name"
																	>
																		<FuseSvgIcon size={14}>{isKeyCopied ? 'lucide:check' : 'lucide:copy'}</FuseSvgIcon>
																	</button>
																</div>
																<p className="text-sm text-slate-600 dark:text-slate-300 m-0 leading-relaxed flex-1">{field.description}</p>
															</div>
														);
													})}
												</div>
											</div>
										)}

										{/* Middleware Execution Pipeline Architecture Card */}
										{selectedSection === 'middlewares' && (
											<div className="bg-white dark:bg-slate-900/90 p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-[0_16px_40px_-12px_rgba(0,50,171,0.06),0_4px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]">
												<div className="flex items-center gap-3 mb-5">
													<div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-2xs border border-indigo-200/60">
														<FuseSvgIcon size={16} className="text-indigo-600 dark:text-indigo-400">lucide:git-commit-horizontal</FuseSvgIcon>
													</div>
													<h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 m-0">
														Express Request Lifecycle & Interception
													</h3>
												</div>
												<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
													<div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center shadow-2xs">
														<span className="text-[11px] font-bold uppercase text-slate-400">Step 1</span>
														<div className="text-sm font-bold text-slate-900 dark:text-white mt-1">HTTP Request Arrival</div>
														<p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 m-0">Inspects headers, Bearer tokens, cookies, and route parameters.</p>
													</div>
													<div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-center shadow-2xs">
														<span className="text-[11px] font-bold uppercase text-[#0032ab] dark:text-blue-400">Step 2</span>
														<div className="text-sm font-bold text-[#0032ab] dark:text-blue-300 mt-1">Security / Guard Hook</div>
														<p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 m-0">Decodes tokens, verifies session validity, checks user role authorization.</p>
													</div>
													<div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 text-center shadow-2xs">
														<span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Step 3</span>
														<div className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-1">Resolution & Pipeline</div>
														<p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 m-0">Passes execution forward via next() or rejects with formatted ApiError.</p>
													</div>
												</div>
											</div>
										)}

										{/* Utilities Scope Architecture Card */}
										{selectedSection === 'utilities' && (
											<div className="bg-white dark:bg-slate-900/90 p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-[0_16px_40px_-12px_rgba(0,50,171,0.06),0_4px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]">
												<div className="flex items-center gap-3 mb-5">
													<div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-2xs border border-amber-200/60">
														<FuseSvgIcon size={16} className="text-amber-600 dark:text-amber-400">lucide:layers</FuseSvgIcon>
													</div>
													<h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 m-0">
														Utility Execution & Functional Scope
													</h3>
												</div>
												<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
													<div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center shadow-2xs">
														<span className="text-[11px] font-bold uppercase text-slate-400">Execution</span>
														<div className="text-sm font-bold text-slate-900 dark:text-white mt-1">Async & Sync Safety</div>
														<p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 m-0">Guarantees zero unhandled promise rejections and clean call stacks.</p>
													</div>
													<div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-center shadow-2xs">
														<span className="text-[11px] font-bold uppercase text-[#0032ab] dark:text-blue-400">Modularity</span>
														<div className="text-sm font-bold text-[#0032ab] dark:text-blue-300 mt-1">Pure Core Dependency</div>
														<p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 m-0">Re-usable across controllers, background workers, and CLI commands.</p>
													</div>
													<div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-center shadow-2xs">
														<span className="text-[11px] font-bold uppercase text-indigo-600 dark:text-indigo-400">Error Contracts</span>
														<div className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mt-1">Standardized Output</div>
														<p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 m-0">Uniform JSON payload response format matching the Gravurtastisch standard.</p>
													</div>
												</div>
											</div>
										)}

										{/* Plugins Schema Attachment Card */}
										{selectedSection === 'plugins' && (
											<div className="bg-white dark:bg-slate-900/90 p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-[0_16px_40px_-12px_rgba(0,50,171,0.06),0_4px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]">
												<div className="flex items-center gap-3 mb-5">
													<div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-2xs border border-teal-200/60">
														<FuseSvgIcon size={16} className="text-teal-600 dark:text-teal-400">lucide:puzzle</FuseSvgIcon>
													</div>
													<h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 m-0">
														Mongoose Schema Plugin Architecture
													</h3>
												</div>
												<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
													<div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center shadow-2xs">
														<span className="text-[11px] font-bold uppercase text-slate-400">Binding</span>
														<div className="text-sm font-bold text-slate-900 dark:text-white mt-1">schema.plugin(fn)</div>
														<p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 m-0">Globally attaches methods, statics, and query transforms to schemas.</p>
													</div>
													<div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-center shadow-2xs">
														<span className="text-[11px] font-bold uppercase text-[#0032ab] dark:text-blue-400">Serialization</span>
														<div className="text-sm font-bold text-[#0032ab] dark:text-blue-300 mt-1">toJSON Sanitization</div>
														<p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 m-0">Automatically strips password, __v, and internal timestamps on output.</p>
													</div>
													<div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 text-center shadow-2xs">
														<span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Pagination</span>
														<div className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-1">Unified Query Results</div>
														<p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 m-0">Computes limit, page, totalPages, and totalResults in a single call.</p>
													</div>
												</div>
											</div>
										)}

										{/* Notes / Rules Checklist: Elevated Checklist Card */}
										{((selectedSection === 'models' ? activeModel?.notes : selectedSection === 'middlewares' ? activeMiddleware?.notes : selectedSection === 'utilities' ? activeUtility?.notes : activePlugin?.notes)?.length ?? 0) > 0 && (
											<div className="bg-white dark:bg-slate-900/90 p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-[0_16px_40px_-12px_rgba(0,50,171,0.06),0_4px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]">
												<div className="flex items-center gap-3 mb-5">
													<div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs border border-emerald-200/60">
														<FuseSvgIcon size={16} className="text-emerald-600 dark:text-emerald-400">lucide:circle-check</FuseSvgIcon>
													</div>
													<h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 m-0">
														Implementation Guidelines & Behavior
													</h3>
												</div>
												<ul className="space-y-3 p-0 m-0 list-none">
													{(selectedSection === 'models' ? activeModel?.notes : selectedSection === 'middlewares' ? activeMiddleware?.notes : selectedSection === 'utilities' ? activeUtility?.notes : activePlugin?.notes)?.map((note, idx) => (
														<li key={idx} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors shadow-2xs">
															<span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
																<FuseSvgIcon size={13}>lucide:check</FuseSvgIcon>
															</span>
															<span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{note}</span>
														</li>
													))}
												</ul>
											</div>
										)}
									</div>
								)}

								{/* Right Pane: Sleek Dark Code IDE with line numbers & terminal bar */}
								{(activeTab === 'both' || activeTab === 'code') && (
									<div className={`${activeTab === 'both' ? 'lg:col-span-5' : 'lg:col-span-12'} bg-[#090d16] text-slate-100 flex flex-col h-full min-h-0 overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.85)] border-l border-slate-800`}>
										{/* IDE Terminal Bar */}
										<div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-800/90 bg-[#0c1220]">
											<div className="flex items-center gap-3">
												<div className="flex items-center gap-1.5 mr-1">
													<span className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-2xs" />
													<span className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-2xs" />
													<span className="w-3 h-3 rounded-full bg-[#27c93f] shadow-2xs" />
												</div>
												<span className="text-xs font-mono font-bold text-slate-300 px-2.5 py-1 rounded-md bg-slate-800/70 border border-slate-700/60 flex items-center gap-1.5">
													<FuseSvgIcon size={13} className="text-blue-400">lucide:file-code</FuseSvgIcon>
													<span>
														{selectedSection === 'models' && `${activeModel?.shortTitle}.model.ts`}
														{selectedSection === 'middlewares' && `${activeMiddleware?.id}.ts`}
														{selectedSection === 'utilities' && `${activeUtility?.id}.ts`}
														{selectedSection === 'plugins' && `${activePlugin?.id}.ts`}
													</span>
												</span>
												<span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
													{activeCodeLines.length} lines
												</span>
											</div>

											<Button
												variant="outlined"
												size="small"
												onClick={() => copyCode(activeCode)}
												className="normal-case text-xs font-semibold px-3 py-1.5 rounded-lg border-slate-700 bg-slate-800/70 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-1.5 shadow-2xs transition-all"
											>
												<FuseSvgIcon size={14}>{copied ? 'lucide:check' : 'lucide:copy'}</FuseSvgIcon>
												<span>{copied ? 'Copied!' : 'Copy Code'}</span>
											</Button>
										</div>

										{/* Code Content: Line-numbered developer editor */}
										<div className="flex-1 overflow-auto bg-[#090d16] font-mono text-[12.5px] leading-6 text-slate-200 selection:bg-blue-600/40 selection:text-white">
											<div className="min-w-full inline-block py-4">
												{activeCodeLines.map((line, idx) => (
													<div key={idx} className="flex hover:bg-slate-800/50 px-4 py-0.5 group transition-colors">
														<span className="w-10 shrink-0 text-right pr-4 text-slate-600 select-none text-[11px] font-mono group-hover:text-slate-400">
															{idx + 1}
														</span>
														<span className="flex-1 whitespace-pre">{line}</span>
													</div>
												))}
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					{/* ============================================================== */}
					{/* 6. CONFIGURATION VIEW: Elevated Cards with Multi-Layer Shadows */}
					{/* ============================================================== */}
					{selectedSection === 'configuration' && docData?.configuration && (
						<div className="flex-1 h-full min-h-0 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50/70 dark:bg-[#070b14] relative">
							{/* Ambient brand glow */}
							<div className="absolute top-0 right-10 w-96 h-96 bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

							{/* Overview Metrics Cards */}
							<div className="relative overflow-hidden bg-white dark:bg-slate-900/90 p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-[0_16px_40px_-12px_rgba(0,50,171,0.08),0_4px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7),0_0_24px_rgba(0,50,171,0.12)]">
								<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0032ab] via-blue-500 to-indigo-500" />

								<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/70 text-[#0032ab] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 shadow-2xs">
									Runtime Configuration
								</span>
								<h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3 m-0 tracking-tight">
									Runtime Configuration & Environment
								</h2>
								<p className="text-base text-slate-600 dark:text-slate-300 mt-2 leading-relaxed m-0">
									Server process ports, database cluster connection, and JWT session lifetimes.
								</p>

								<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
									<div className="bg-white dark:bg-slate-900/90 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-center shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)] hover:shadow-md transition-all">
										<div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Backend Port</div>
										<div className="text-3xl font-extrabold text-[#0032ab] dark:text-blue-400 mt-1.5">{docData.configuration.serverPort}</div>
									</div>
									<div className="bg-white dark:bg-slate-900/90 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-center shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)] hover:shadow-md transition-all">
										<div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Environment</div>
										<div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5 capitalize">{docData.configuration.environment}</div>
									</div>
									<div className="bg-white dark:bg-slate-900/90 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-center shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)] hover:shadow-md transition-all">
										<div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Auth Token Window</div>
										<div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1.5">{docData.configuration.authWindow}</div>
									</div>
								</div>
							</div>

							{/* Configuration Groups: Elevated Cards */}
							<div className="space-y-5">
								{docData.configuration.groups.map((grp, idx) => (
									<div key={idx} className="bg-white dark:bg-slate-900/90 p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-[0_16px_40px_-12px_rgba(0,50,171,0.06),0_4px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]">
										<h3 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0">{grp.title}</h3>
										<p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">{grp.summary}</p>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
											{grp.entries.map((entry, eIdx) => {
												const isEnvCopied = copiedKey === `env-${idx}-${eIdx}`;
												return (
													<div key={eIdx} className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 hover:border-blue-200/60 transition-all shadow-2xs group flex items-start justify-between gap-3">
														<div>
															<code className="text-xs sm:text-sm font-mono font-bold text-[#0032ab] dark:text-blue-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">{entry.key}</code>
															<p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 m-0 leading-relaxed">{entry.description}</p>
														</div>
														<button
															type="button"
															onClick={() => copyText(entry.key, `env-${idx}-${eIdx}`)}
															className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-[#0032ab] dark:hover:text-blue-300 p-1"
															title="Copy variable key"
														>
															<FuseSvgIcon size={14}>{isEnvCopied ? 'lucide:check' : 'lucide:copy'}</FuseSvgIcon>
														</button>
													</div>
												);
											})}
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</main>
			</div>
		</div>
	);
}

export default ApiDocsView;
