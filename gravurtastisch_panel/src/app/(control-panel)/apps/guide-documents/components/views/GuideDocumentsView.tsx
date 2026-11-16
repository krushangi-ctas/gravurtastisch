'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import FusePageCarded from '@fuse/core/FusePageCarded';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import {
	Button,
	IconButton,
	TextField,
	InputAdornment,
	CircularProgress,
	Tooltip,
	Switch,
	Chip,
	Paper,
	Dialog
} from '@mui/material';
import { useSnackbar } from 'notistack';
import usePermissions from '@/hooks/usePermissions';
import AccessDeniedView from '@/components/AccessDeniedView';
import { GuideModule, GuideStep } from '../../api/types';
import {
	useModulesTree,
	usePublishedTree,
	usePublishedChildDetails,
	useModuleDetails,
	useUpdateModule,
	useDeleteModule,
	useDeleteStep,
	useReorderSteps
} from '../../api/hooks/useGuideDocuments';
import ModuleDialog from '../dialogs/ModuleDialog';
import ImageLightboxDialog from '../dialogs/ImageLightboxDialog';
import { getImageUrl } from '@/configs/env';

const Root = styled(FusePageCarded)(() => ({
	'& .container': {
		maxWidth: '100%!important',
		padding: '0!important',
		height: '100%',
		display: 'flex',
		flexDirection: 'column'
	},
	'& .FusePageCarded-header': {
		marginBottom: '0px',
		display: 'none'
	},
	'& .FusePageCarded-contentWrapper': {
		overflow: 'hidden!important',
		display: 'flex',
		flexDirection: 'column',
		height: '100%',
		minHeight: 0
	},
	'& .FusePageCarded-content': {
		display: 'flex',
		flexDirection: 'column',
		flex: '1 1 auto',
		minHeight: 0,
		height: '100%',
		overflow: 'hidden'
	}
}));

export default function GuideDocumentsView() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const {
		scope,
		isSuperAdmin,
		user,
		canView,
		canCreate,
		canUpdate,
		canDelete
	} = usePermissions();

	const sectionKey = 'guide-document';
	const hasAccess = canView(sectionKey);
	const userCanCreate = canCreate(sectionKey);
	const userCanUpdate = canUpdate(sectionKey);
	const userCanDelete = canDelete(sectionKey);
	// Determine whether current session is admin or seller
	const isAdmin = scope === 'admin' || isSuperAdmin || user?.userType === 'admin';
	const userCanManage = isAdmin && (userCanCreate || userCanUpdate || userCanDelete);
	const targetAdminSection = isAdmin;

	// View mode vs Manage mode (only users with manage permissions can toggle)
	const [isManageMode, setIsManageMode] = useState(false);

	// Search keyword
	const [searchQuery, setSearchQuery] = useState('');

	// Active selected parent & child
	const [searchParams, setSearchParams] = useSearchParams();
	const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
	const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
	const [expandedParentIds, setExpandedParentIds] = useState<Set<string>>(new Set());

	// Scroll and Active step tracking for "ON THIS PAGE" panel
	const mainScrollRef = useRef<HTMLDivElement | null>(null);
	const [activeStepId, setActiveStepId] = useState<string | null>(null);

	// Dialog states
	const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
	const [editingModule, setEditingModule] = useState<GuideModule | null>(null);
	const [parentForNewChild, setParentForNewChild] = useState<GuideModule | null>(null);

	const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

	// Confirm Dialog state (matches UsersView confirmation dialog for Delete & Publish/Unpublish)
	const [confirmState, setConfirmState] = useState<{
		open: boolean;
		actionType: 'delete' | 'status';
		itemType: 'parent' | 'child' | 'step';
		module?: GuideModule | null;
		step?: GuideStep | null;
		targetPublished?: boolean;
		title: string;
		itemName: string;
		description: React.ReactNode;
	}>({
		open: false,
		actionType: 'delete',
		itemType: 'child',
		module: null,
		step: null,
		targetPublished: false,
		title: '',
		itemName: '',
		description: null
	});
	const [isActionLoading, setIsActionLoading] = useState(false);

	// Mutations
	const updateModuleMutation = useUpdateModule();
	const deleteModuleMutation = useDeleteModule();
	const deleteStepMutation = useDeleteStep();
	const reorderStepsMutation = useReorderSteps();

	// Data Fetching
	// In manage mode, fetch all modules (draft + published). In viewer mode, fetch published tree.
	const modulesTreeQuery = useModulesTree(
		{ search: searchQuery, isAdminSection: targetAdminSection },
		Boolean(hasAccess && isManageMode && userCanManage)
	);

	const publishedTreeQuery = usePublishedTree(
		targetAdminSection,
		Boolean(hasAccess && (!isManageMode || !userCanManage))
	);

	const activeTree = useMemo(() => {
		if (isManageMode && userCanManage) {
			return modulesTreeQuery.data?.data || [];
		}
		return publishedTreeQuery.data?.data || [];
	}, [isManageMode, userCanManage, modulesTreeQuery.data, publishedTreeQuery.data]);

	const isLoadingTree =
		(isManageMode && userCanManage ? modulesTreeQuery.isLoading : publishedTreeQuery.isLoading);

	// Filter tree by client search when in published mode
	const filteredTree = useMemo(() => {
		if (!searchQuery.trim() || (isManageMode && userCanManage)) {
			return activeTree;
		}
		const query = searchQuery.toLowerCase().trim();
		return activeTree
			.map((parent) => {
				const parentMatches =
					parent.title?.toLowerCase().includes(query) ||
					parent.description?.toLowerCase().includes(query);
				const matchingChildren = (parent.children || []).filter(
					(child) =>
						child.title?.toLowerCase().includes(query) ||
						child.description?.toLowerCase().includes(query)
				);
				if (parentMatches || matchingChildren.length > 0) {
					return {
						...parent,
						children: parentMatches ? parent.children : matchingChildren
					};
				}
				return null;
			})
			.filter(Boolean) as GuideModule[];
	}, [activeTree, searchQuery, isManageMode, isAdmin]);

	// Resolved selected parent and child objects
	const selectedParent = useMemo(() => {
		if (!filteredTree.length || !selectedParentId) return null;
		return (
			filteredTree.find(
				(p) => (p._id || p.id) === selectedParentId
			) || null
		);
	}, [filteredTree, selectedParentId]);

	const selectedChild = useMemo(() => {
		if (!selectedParent || !selectedChildId) return null;
		return (
			(selectedParent.children || []).find(
				(c) => (c._id || c.id) === selectedChildId
			) || null
		);
	}, [selectedParent, selectedChildId]);

	// Auto-select parent and child when tree loads (supports URL query params e.g. ?parent=...&child=...)
	useEffect(() => {
		if (filteredTree.length > 0) {
			const urlChildId = searchParams.get('child');
			const urlParentId = searchParams.get('parent');

			// If URL specifically asked for a child, locate its parent
			if (urlChildId) {
				const parentWithChild = filteredTree.find((p) =>
					(p.children || []).some((c) => (c._id || c.id) === urlChildId)
				);
				if (parentWithChild) {
					const pid = parentWithChild._id || parentWithChild.id || '';
					setSelectedParentId(pid);
					setSelectedChildId(urlChildId);
					setExpandedParentIds((prev) => new Set([...prev, pid]));
					return;
				}
			}

			// If URL asked for a parent
			if (urlParentId) {
				const matchingParent = filteredTree.find((p) => (p._id || p.id) === urlParentId);
				if (matchingParent) {
					const pid = matchingParent._id || matchingParent.id || '';
					setSelectedParentId(pid);
					setExpandedParentIds((prev) => new Set([...prev, pid]));
					if (matchingParent.children && matchingParent.children.length > 0) {
						setSelectedChildId(matchingParent.children[0]._id || matchingParent.children[0].id || null);
					}
					return;
				}
			}

			const hasValidParent =
				selectedParentId &&
				filteredTree.some((p) => (p._id || p.id) === selectedParentId);

			if (!hasValidParent) {
				const firstParent = filteredTree[0];
				const firstPid = firstParent._id || firstParent.id || '';
				setSelectedParentId(firstPid);
				setExpandedParentIds((prev) => new Set([...prev, firstPid]));

				if (firstParent.children && firstParent.children.length > 0) {
					const firstCid = firstParent.children[0]._id || firstParent.children[0].id || null;
					setSelectedChildId(firstCid);
					if (firstCid) {
						setSearchParams({ parent: firstPid, child: firstCid }, { replace: true });
					}
				} else {
					setSelectedChildId(null);
				}
			}
		} else {
			setSelectedParentId(null);
			setSelectedChildId(null);
		}
	}, [filteredTree, selectedParentId]);

	// Selected child details fetching (steps)
	const publishedChildQuery = usePublishedChildDetails(
		selectedChildId || undefined,
		(!isManageMode || !isAdmin) && Boolean(selectedChildId)
	);

	const adminModuleDetailsQuery = useModuleDetails(
		selectedChildId || undefined,
		isManageMode && isAdmin && Boolean(selectedChildId)
	);

	const selectedData = useMemo(() => {
		if (!selectedChildId) {
			return { module: null, steps: [] };
		}
		if (isManageMode && isAdmin) {
			const mod = adminModuleDetailsQuery.data?.data?.module;
			const steps = adminModuleDetailsQuery.data?.data?.steps || [];
			return { module: mod || selectedChild, steps };
		}
		return {
			module: publishedChildQuery.data?.data?.module || selectedChild,
			steps: publishedChildQuery.data?.data?.steps || []
		};
	}, [
		selectedChildId,
		selectedChild,
		isManageMode,
		isAdmin,
		adminModuleDetailsQuery.data,
		publishedChildQuery.data
	]);

	// Update default active step when steps load
	useEffect(() => {
		if (selectedData.steps.length > 0) {
			const first = selectedData.steps[0];
			setActiveStepId(first._id || 'step-1');
		} else {
			setActiveStepId(null);
		}
	}, [selectedData.steps]);

	const scrollToStep = (elementId: string, stepKey?: string) => {
		const el = document.getElementById(elementId);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
			if (stepKey) setActiveStepId(stepKey);
		}
	};

	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		if (!selectedData.steps.length) return;
		const container = e.currentTarget;
		const scrollPos = container.scrollTop + 140;

		for (let i = selectedData.steps.length - 1; i >= 0; i--) {
			const step = selectedData.steps[i];
			const stepNum = step.stepOrder || i + 1;
			const el = document.getElementById(`step-${stepNum}`);
			if (el) {
				const offsetTop = el.offsetTop;
				if (scrollPos >= offsetTop) {
					setActiveStepId(step._id || `step-${stepNum}`);
					break;
				}
			}
		}
	};

	const isLoadingDetails =
		Boolean(selectedChildId) &&
		(isManageMode && isAdmin
			? adminModuleDetailsQuery.isLoading
			: publishedChildQuery.isLoading);

	// Toggle parent expansion and select parent
	const handleParentClick = (parent: GuideModule) => {
		const pid = parent._id || parent.id || '';
		setSelectedParentId(pid);
		// Toggle expand
		setExpandedParentIds((prev) => {
			const next = new Set(prev);
			if (next.has(pid)) {
				next.delete(pid);
			} else {
				next.add(pid);
			}
			return next;
		});

		// If user clicked parent directly, they might want to view the parent category
		// or open its first child
		if (parent.children && parent.children.length > 0) {
			const hasMatchingChild =
				selectedChildId &&
				parent.children.some((c) => (c._id || c.id) === selectedChildId);
			if (!hasMatchingChild) {
				const firstChildId = parent.children[0]._id || parent.children[0].id || null;
				setSelectedChildId(firstChildId);
				if (firstChildId) {
					setSearchParams({ parent: pid, child: firstChildId }, { replace: true });
				}
			}
		} else {
			setSelectedChildId(null);
			setSearchParams({ parent: pid }, { replace: true });
		}
	};

	const handleSelectChild = (parent: GuideModule, child: GuideModule) => {
		const pid = parent._id || parent.id || '';
		const cid = child._id || child.id || '';
		setSelectedParentId(pid);
		setSelectedChildId(cid);
		setExpandedParentIds((prev) => new Set([...prev, pid]));
		setSearchParams({ parent: pid, child: cid }, { replace: true });
	};

	// Actions: Module publish/unpublish toggle (opens confirmation dialog)
	const handleTogglePublish = (m: GuideModule, e: React.MouseEvent) => {
		e.stopPropagation();
		if (!userCanUpdate) {
			enqueueSnackbar('You do not have permission to update guides.', { variant: 'error' });
			return;
		}
		if (!m._id) return;
		const isParent = !m.parentId;
		const nextPublished = !m.isPublished;
		const itemLabel = isParent ? 'parent module' : 'child guide';
		const title = nextPublished
			? `Publish ${isParent ? 'Parent Module' : 'Child Guide'}`
			: `Unpublish ${isParent ? 'Parent Module' : 'Child Guide'}`;

		setConfirmState({
			open: true,
			actionType: 'status',
			itemType: isParent ? 'parent' : 'child',
			module: m,
			step: null,
			targetPublished: nextPublished,
			title,
			itemName: m.title || m.moduleName || 'this module',
			description: (
				<>
					Are you sure you want to change status of{' '}
					<strong className="text-slate-800 dark:text-slate-200 font-semibold">
						{m.title || m.moduleName}
					</strong>{' '}
					to{' '}
					<strong className="text-slate-800 dark:text-slate-200 font-semibold">
						{nextPublished ? 'Published' : 'Draft / Unpublished'}
					</strong>
					? {nextPublished
						? `This ${itemLabel} will become visible to users in Viewer mode.`
						: `This ${itemLabel} will be hidden from users in Viewer mode.`}
				</>
			)
		});
	};

	// Actions: Delete Module (opens confirmation dialog)
	const handleDeleteModule = (m: GuideModule, e: React.MouseEvent) => {
		e.stopPropagation();
		if (!userCanDelete) {
			enqueueSnackbar('You do not have permission to delete guides.', { variant: 'error' });
			return;
		}
		if (!m._id) return;
		const isParent = !m.parentId;
		setConfirmState({
			open: true,
			actionType: 'delete',
			itemType: isParent ? 'parent' : 'child',
			module: m,
			step: null,
			targetPublished: false,
			title: isParent ? 'Delete Parent Module' : 'Delete Child Guide',
			itemName: m.title || m.moduleName || 'this item',
			description: (
				<>
					Are you sure you want to delete{' '}
					<strong className="text-slate-800 dark:text-slate-200 font-semibold">
						{m.title || m.moduleName}
					</strong>
					?{' '}
					{isParent
						? 'All child guides and steps inside this category will also be permanently deleted. This action cannot be undone.'
						: 'All steps inside this guide will also be permanently deleted. This action cannot be undone.'}
				</>
			)
		});
	};

	// Actions: Step Reordering (Move Up / Down)
	const handleMoveStep = async (stepIndex: number, direction: 'up' | 'down') => {
		if (!userCanUpdate) {
			enqueueSnackbar('You do not have permission to update steps.', { variant: 'error' });
			return;
		}
		if (!selectedChildId || !selectedData.steps.length) return;
		const steps = [...selectedData.steps];
		const targetIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;

		if (targetIndex < 0 || targetIndex >= steps.length) return;

		// Swap
		const temp = steps[stepIndex];
		steps[stepIndex] = steps[targetIndex];
		steps[targetIndex] = temp;

		// Re-assign stepOrder
		const payload = steps.map((s, idx) => ({
			id: s._id || s.id || '',
			stepOrder: idx + 1
		}));

		try {
			await reorderStepsMutation.mutateAsync({
				moduleId: selectedChildId,
				steps: payload
			});
			enqueueSnackbar('Step order updated successfully.', { variant: 'success' });
		} catch (err: any) {
			enqueueSnackbar(err?.message || 'Failed to update step order', { variant: 'error' });
		}
	};

	// Actions: Delete Step (opens confirmation dialog)
	const handleDeleteStep = (step: GuideStep) => {
		if (!userCanDelete) {
			enqueueSnackbar('You do not have permission to delete steps.', { variant: 'error' });
			return;
		}
		const sid = step._id || step.id;
		if (!sid) return;
		setConfirmState({
			open: true,
			actionType: 'delete',
			itemType: 'step',
			module: null,
			step,
			targetPublished: false,
			title: 'Delete Step',
			itemName: `Step #${step.stepOrder || ''}${step.title ? `: ${step.title}` : ''}`,
			description: (
				<>
					Are you sure you want to delete{' '}
					<strong className="text-slate-800 dark:text-slate-200 font-semibold">
						Step #{step.stepOrder || ''}{step.title ? ` (${step.title})` : ''}
					</strong>
					? This step and its instructions will be permanently removed. This action cannot be undone.
				</>
			)
		});
	};

	// Execute Action: Delete or Status Toggle
	const handleConfirmAction = async () => {
		if (isActionLoading) return;
		if (confirmState.actionType === 'status' && !userCanUpdate) {
			enqueueSnackbar('You do not have permission to update guides.', { variant: 'error' });
			return;
		}
		if (confirmState.actionType === 'delete' && !userCanDelete) {
			enqueueSnackbar('You do not have permission to delete.', { variant: 'error' });
			return;
		}
		setIsActionLoading(true);
		try {
			if (confirmState.actionType === 'status') {
				const m = confirmState.module;
				if (m && m._id) {
					await updateModuleMutation.mutateAsync({
						moduleId: m._id,
						payload: { isPublished: confirmState.targetPublished }
					});
					const isParent = confirmState.itemType === 'parent';
					const statusText = confirmState.targetPublished ? 'published' : 'unpublished';
					enqueueSnackbar(
						isParent
							? `Parent module ${statusText} successfully.`
							: `Child guide ${statusText} successfully.`,
						{ variant: 'success' }
					);
				}
			} else if (confirmState.actionType === 'delete') {
				if (confirmState.itemType === 'parent' || confirmState.itemType === 'child') {
					const m = confirmState.module;
					if (m && m._id) {
						await deleteModuleMutation.mutateAsync(m._id);
						const isParent = confirmState.itemType === 'parent';
						enqueueSnackbar(
							isParent
								? 'Parent module deleted successfully.'
								: 'Child guide deleted successfully.',
							{ variant: 'success' }
						);
						if (selectedChildId === m._id) {
							setSelectedChildId(null);
						}
						if (selectedParentId === m._id) {
							setSelectedParentId(null);
						}
					}
				} else if (confirmState.itemType === 'step') {
					const s = confirmState.step;
					const sid = s?._id || s?.id;
					if (sid) {
						await deleteStepMutation.mutateAsync(sid);
						enqueueSnackbar('Step deleted successfully.', { variant: 'success' });
					}
				}
			}
			setConfirmState((prev) => ({ ...prev, open: false }));
		} catch (err: any) {
			enqueueSnackbar(err?.message || 'Operation failed', { variant: 'error' });
		} finally {
			setIsActionLoading(false);
		}
	};

	if (!hasAccess) {
		return <AccessDeniedView sectionTitle="Guide Documents" />;
	}

	return (
		<>
			<Root
				content={
					<Paper
						className="flex w-full flex-auto rounded-none mt-0 h-full overflow-hidden"
						elevation={0}
						square
						sx={{
							borderRadius: '0px !important',
							boxShadow: 'none !important',
							display: 'flex',
							flexDirection: 'column',
							height: '100%',
							minHeight: 0
						}}
					>
						{/* Top Header */}
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-5 sm:py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
							<div className="flex items-center gap-3">
								<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300 shadow-xs">
									<FuseSvgIcon size={22}>lucide:book-open</FuseSvgIcon>
								</div>
								<div>
									<h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
										Guide Documents
									</h1>
									<p className="text-xs text-slate-500 dark:text-slate-400">
										{isAdmin
											? 'Manage and view comprehensive step-by-step guides for Admin and Sellers'
											: 'Interactive step-by-step documentation and platform guides'}
									</p>
								</div>
							</div>

							<div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
								{/* Admin / Manage Controls */}
								{userCanManage && (
									<>
										<div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
											<button
												type="button"
												onClick={() => setIsManageMode(false)}
												className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
													!isManageMode
														? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-xs'
														: 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
												}`}
											>
												<FuseSvgIcon size={14}>lucide:eye</FuseSvgIcon>
												Viewer
											</button>
											<button
												type="button"
												onClick={() => setIsManageMode(true)}
												className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
													isManageMode
														? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-xs'
														: 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
												}`}
											>
												<FuseSvgIcon size={14}>lucide:pencil</FuseSvgIcon>
												Manage
											</button>
										</div>

										{isManageMode && userCanCreate && (
											<Button
												variant="contained"
												size="small"
												onClick={() => {
													setEditingModule(null);
													setParentForNewChild(null);
													setModuleDialogOpen(true);
												}}
												startIcon={<FuseSvgIcon size={16}>lucide:plus</FuseSvgIcon>}
												className="bg-primary-500 hover:bg-primary-600 text-white shadow-xs rounded-lg text-xs py-1.5"
											>
												Add Parent
											</Button>
										)}
									</>
								)}
							</div>
						</div>

						{/* Main Content Split: Left Sidebar + Right View */}
						<div className="flex-1 flex flex-row min-h-0 overflow-x-auto overflow-y-hidden bg-slate-50/50 dark:bg-slate-950">
							{/* Left Sidebar: Modules Hierarchy Tree */}
							<aside className="w-52 sm:w-60 md:w-64 lg:w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 h-full">
								{/* Search filter in sidebar */}
								<div className="p-3 border-b border-slate-100 dark:border-slate-800">
									<TextField
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="Search guides or categories..."
										size="small"
										fullWidth
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<FuseSvgIcon size={16} className="text-slate-400">
														lucide:search
													</FuseSvgIcon>
												</InputAdornment>
											),
											className: 'rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs'
										}}
									/>
								</div>

								{/* Tree List */}
								<div className="flex-1 overflow-y-auto p-3 space-y-2.5">
									{isLoadingTree ? (
										<div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-2">
											<CircularProgress size={24} className="text-primary-500" />
											<span className="text-xs">Loading categories...</span>
										</div>
									) : filteredTree.length === 0 ? (
										<div className="text-center p-8 text-slate-400 space-y-3">
											<div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
												<FuseSvgIcon size={22}>lucide:book-x</FuseSvgIcon>
											</div>
											<p className="text-xs font-medium">No guide categories found</p>
											{isManageMode && userCanCreate && (
												<Button
													size="small"
													variant="outlined"
													onClick={() => {
														setEditingModule(null);
														setParentForNewChild(null);
														setModuleDialogOpen(true);
													}}
													className="text-xs border-primary-200 text-primary-600"
												>
													Create First Parent
												</Button>
											)}
										</div>
									) : (
										filteredTree.map((parent) => {
											const pid = parent._id || parent.id || '';
											const isExpanded = expandedParentIds.has(pid);
											const isParentSelected =
												selectedParentId === pid && !selectedChildId;
											const children = parent.children || [];

											return (
												<div
													key={pid}
													className={`rounded-xl border transition-all overflow-hidden ${
														selectedParentId === pid
															? 'border-primary-300 dark:border-primary-800 bg-white dark:bg-slate-800/60 shadow-xs'
															: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/40 shadow-2xs'
													}`}
												>
													{/* Parent Header */}
													<div
														onClick={() => handleParentClick(parent)}
														className={`flex items-center justify-between p-2.5 px-3 cursor-pointer transition-colors select-none ${
															isParentSelected
																? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300'
																: 'bg-slate-50/70 dark:bg-slate-800/70 hover:bg-slate-100/70 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
														}`}
													>
														<div className="flex items-center gap-2 min-w-0 flex-1">
															<FuseSvgIcon
																size={16}
																className={`text-slate-400 transition-transform ${
																	isExpanded ? 'rotate-90' : ''
																}`}
															>
																lucide:chevron-right
															</FuseSvgIcon>
															<FuseSvgIcon size={16} className="text-primary-500 shrink-0">
																lucide:folder
															</FuseSvgIcon>
															<span className="text-xs font-bold truncate">
																{parent.title || parent.moduleName}
															</span>
															<span className="text-[10px] font-medium text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">
																{children.length}
															</span>
														</div>

														{/* Manage mode controls on parent */}
														{isManageMode && userCanManage && (
															<div
																className="flex items-center gap-0.5 shrink-0"
																onClick={(e) => e.stopPropagation()}
															>
																{userCanCreate && (
																	<Tooltip title="Add Child Guide">
																		<IconButton
																			size="small"
																			onClick={() => {
																				setEditingModule(null);
																				setParentForNewChild(parent);
																				setModuleDialogOpen(true);
																			}}
																			className="p-1 text-slate-500 hover:text-primary-600 hover:bg-primary-50"
																		>
																			<FuseSvgIcon size={14}>lucide:plus</FuseSvgIcon>
																		</IconButton>
																	</Tooltip>
																)}
																{userCanUpdate && (
																	<>
																		<Tooltip
																			title={
																				parent.isPublished
																					? 'Published (click to unpublish)'
																					: 'Draft (click to publish)'
																			}
																		>
																			<Switch
																				size="small"
																				checked={Boolean(parent.isPublished)}
																				onClick={(e) => handleTogglePublish(parent, e)}
																				color="primary"
																			/>
																		</Tooltip>
																		<Tooltip title="Edit Category">
																			<IconButton
																				size="small"
																				onClick={() => {
																					setEditingModule(parent);
																					setParentForNewChild(null);
																					setModuleDialogOpen(true);
																				}}
																				className="p-1 text-slate-500 hover:text-slate-700"
																			>
																				<FuseSvgIcon size={14}>lucide:pencil</FuseSvgIcon>
																			</IconButton>
																		</Tooltip>
																	</>
																)}
																{userCanDelete && (
																	<Tooltip title="Delete Category">
																		<IconButton
																			size="small"
																			onClick={(e) => handleDeleteModule(parent, e)}
																			className="p-1 text-rose-500 hover:bg-rose-50"
																		>
																			<FuseSvgIcon size={14}>lucide:trash-2</FuseSvgIcon>
																		</IconButton>
																	</Tooltip>
																)}
															</div>
														)}
													</div>

													{/* Child Guides List */}
													{isExpanded && (
														<div className="p-1.5 space-y-1 bg-white dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800">
															{children.length === 0 ? (
																<div className="py-2 px-3 text-[11px] text-slate-400 italic flex items-center justify-between">
																	<span>No child guides in this category</span>
																	{isManageMode && userCanCreate && (
																		<button
																			type="button"
																			onClick={() => {
																				setEditingModule(null);
																				setParentForNewChild(parent);
																				setModuleDialogOpen(true);
																			}}
																			className="text-[10px] text-primary-600 font-medium hover:underline"
																		>
																			+ Add Child
																		</button>
																	)}
																</div>
															) : (
																children.map((child) => {
																	const cid = child._id || child.id || '';
																	const isSelected = selectedChildId === cid;

																	return (
																		<div
																			key={cid}
																			onClick={() => handleSelectChild(parent, child)}
																			className={`group flex items-center justify-between p-2 px-3 rounded-lg cursor-pointer text-xs transition-all ${
																				isSelected
																					? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-semibold border-l-3 border-primary-500 shadow-2xs'
																					: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
																			}`}
																		>
																			<div className="flex items-center gap-2 min-w-0 flex-1">
																				<FuseSvgIcon
																					size={14}
																					className={
																						isSelected
																							? 'text-primary-600 dark:text-primary-400'
																							: 'text-slate-400'
																					}
																				>
																					lucide:file-text
																				</FuseSvgIcon>
																				<span className="truncate">
																					{child.title || child.moduleName}
																				</span>
																			</div>

																			{/* Status badge or Manage actions */}
																			{isManageMode && userCanManage ? (
																				<div
																					className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100"
																					onClick={(e) => e.stopPropagation()}
																				>
																					{userCanUpdate ? (
																						<Tooltip
																							title={
																								child.isPublished
																									? 'Published'
																									: 'Draft'
																							}
																						>
																							<span
																								onClick={(e) =>
																									handleTogglePublish(child, e)
																								}
																								className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer ${
																									child.isPublished
																										? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
																										: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
																								}`}
																							>
																								{child.isPublished ? 'Live' : 'Draft'}
																							</span>
																						</Tooltip>
																					) : (
																						<span
																							className={`text-[9px] px-1.5 py-0.5 rounded ${
																								child.isPublished
																									? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
																									: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
																							}`}
																						>
																							{child.isPublished ? 'Live' : 'Draft'}
																						</span>
																					)}
																					{userCanUpdate && (
																						<IconButton
																							size="small"
																							onClick={() => {
																								setEditingModule(child);
																								setParentForNewChild(parent);
																								setModuleDialogOpen(true);
																							}}
																							className="p-1 text-slate-400 hover:text-slate-700"
																						>
																							<FuseSvgIcon size={12}>
																								lucide:pencil
																							</FuseSvgIcon>
																						</IconButton>
																					)}
																					{userCanDelete && (
																						<IconButton
																							size="small"
																							onClick={(e) =>
																								handleDeleteModule(child, e)
																							}
																							className="p-1 text-rose-400 hover:text-rose-600"
																						>
																							<FuseSvgIcon size={12}>
																								lucide:trash-2
																							</FuseSvgIcon>
																						</IconButton>
																					)}
																				</div>
																			) : (
																				!child.isPublished && (
																					<span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
																						Draft
																					</span>
																				)
																			)}
																		</div>
																	);
																})
															)}
														</div>
													)}
												</div>
											);
										})
									)}
								</div>
							</aside>

							{/* Right Main Area: Guide Details or Category View */}
							<main
								ref={mainScrollRef}
								onScroll={handleScroll}
								className="flex-1 flex flex-col min-w-[280px] sm:min-w-0 overflow-y-auto bg-slate-50/40 dark:bg-slate-950 h-full"
							>
								{isLoadingDetails ? (
									<div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
										<CircularProgress size={32} className="text-primary-500" />
										<p className="text-xs">Loading guide content...</p>
									</div>
								) : selectedChild ? (
									/* Child Guide View with Step-by-Step Walkthrough */
									<div className="flex-1 flex flex-col xl:flex-row gap-4 p-3 sm:p-4 w-full items-start">
										{/* Main Steps Content */}
										<div className="flex-1 min-w-0 space-y-3 w-full">
											{/* Banner */}
											<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden">
												<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
													<div className="space-y-1">
														<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
															<span
																onClick={() => setSelectedChildId(null)}
																className="cursor-pointer hover:underline flex items-center gap-1"
															>
																<FuseSvgIcon size={14}>lucide:folder</FuseSvgIcon>
																<span>
																	{selectedParent?.title ||
																		selectedParent?.moduleName ||
																		'Documentation'}
																</span>
															</span>
															<span>/</span>
															<span>Guide Document</span>
														</div>
														<h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
															{selectedData.module?.title ||
																selectedData.module?.moduleName ||
																selectedChild.title}
														</h2>
														{(selectedData.module?.description ||
															selectedChild.description) && (
															<p className="text-sm text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
																{selectedData.module?.description ||
																	selectedChild.description}
															</p>
														)}
													</div>

													{/* Top Actions in Banner */}
													<div className="flex items-center gap-2 shrink-0">
														{isManageMode && userCanCreate && (
															<Button
																variant="contained"
																size="small"
																onClick={() => {
																	navigate(`/guide-document/${selectedChildId}/steps/new`, {
																		state: {
																			childModule: selectedChild,
																			parentModule: selectedParent
																		}
																	});
																}}
																startIcon={<FuseSvgIcon size={16}>lucide:plus</FuseSvgIcon>}
																className="bg-primary-500 hover:bg-primary-600 text-white shadow-xs rounded-lg text-xs"
															>
																Add Step
															</Button>
														)}
														<Tooltip
															title={
																isManageMode && userCanUpdate
																	? (selectedData.module?.isPublished ?? selectedChild.isPublished)
																		? 'Click to unpublish'
																		: 'Click to publish'
																	: ''
															}
														>
															<Chip
																size="small"
																onClick={(e) => {
																	if (isManageMode && userCanUpdate) {
																		handleTogglePublish(
																			selectedData.module || selectedChild,
																			e
																		);
																	}
																}}
																label={
																	(selectedData.module?.isPublished ?? selectedChild.isPublished)
																		? 'Live'
																		: 'Draft'
																}
																className={`text-xs font-semibold ${
																	isManageMode && userCanUpdate
																		? 'cursor-pointer hover:opacity-85'
																		: ''
																} ${
																	(selectedData.module?.isPublished ?? selectedChild.isPublished)
																		? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
																		: 'bg-amber-50 text-amber-700 border border-amber-200'
																}`}
															/>
														</Tooltip>
														<Chip
															size="small"
															label={`${selectedData.steps.length} Steps`}
															className="bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 font-semibold text-xs"
														/>
													</div>
												</div>
											</div>

											{/* Steps Walkthrough Cards */}
											<div className="space-y-3">
												{selectedData.steps.length === 0 ? (
													<div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-6 sm:p-8 text-center space-y-2.5">
														<div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
															<FuseSvgIcon size={24}>lucide:list-plus</FuseSvgIcon>
														</div>
														<h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
															No steps added yet
														</h3>
														<p className="text-xs text-slate-500 max-w-sm mx-auto">
															{isManageMode && userCanCreate
																? 'Start building this guide by adding the first step with instructions and screenshot.'
																: 'This guide document does not have any steps yet.'}
														</p>
														{isManageMode && userCanCreate && (
															<Button
																variant="contained"
																size="small"
																onClick={() => {
																	navigate(`/guide-document/${selectedChildId}/steps/new`, {
																		state: {
																			childModule: selectedChild,
																			parentModule: selectedParent
																		}
																	});
																}}
																className="bg-primary-500 text-white text-xs"
															>
																Add First Step
															</Button>
														)}
													</div>
												) : (
													selectedData.steps.map((step, index) => {
														const stepNum = step.stepOrder || index + 1;
														const hasScreenshot = Boolean(step.screenshotUrl);

														return (
															<div
																key={step._id || index}
																id={`step-${stepNum}`}
																className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-shadow hover:shadow-md"
															>
																{/* Card Header */}
																<div className="p-3 sm:px-4 sm:py-3 flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
																	<div className="flex items-center gap-3">
																		<div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 font-bold text-sm shrink-0 shadow-2xs">
																			{stepNum}
																		</div>
																		<h3 className="text-base font-bold text-slate-900 dark:text-white">
																			{step.title || `Step ${stepNum}`}
																		</h3>
																	</div>

																	{/* Manage Mode Step Actions */}
																	{isManageMode && (userCanUpdate || userCanDelete) && (
																		<div className="flex items-center gap-1 shrink-0">
																			{userCanUpdate && (
																				<>
																					<Tooltip title="Move Up">
																						<span>
																							<IconButton
																								size="small"
																								disabled={index === 0}
																								onClick={() => handleMoveStep(index, 'up')}
																								className="text-slate-500 hover:text-primary-600 disabled:opacity-30"
																							>
																								<FuseSvgIcon size={16}>
																									lucide:arrow-up
																								</FuseSvgIcon>
																							</IconButton>
																						</span>
																					</Tooltip>
																					<Tooltip title="Move Down">
																						<span>
																							<IconButton
																								size="small"
																								disabled={
																									index === selectedData.steps.length - 1
																								}
																								onClick={() => handleMoveStep(index, 'down')}
																								className="text-slate-500 hover:text-primary-600 disabled:opacity-30"
																							>
																								<FuseSvgIcon size={16}>
																									lucide:arrow-down
																								</FuseSvgIcon>
																							</IconButton>
																						</span>
																					</Tooltip>
																					<Tooltip title="Edit Step">
																						<IconButton
																							size="small"
																							onClick={() => {
																								navigate(
																									`/guide-document/${selectedChildId}/steps/${step._id || step.id}/edit`,
																									{
																										state: {
																											step,
																											childModule: selectedChild,
																											parentModule: selectedParent
																										}
																									}
																								);
																							}}
																							className="text-slate-500 hover:text-slate-800"
																						>
																							<FuseSvgIcon size={16}>
																								lucide:pencil
																							</FuseSvgIcon>
																						</IconButton>
																					</Tooltip>
																				</>
																			)}
																			{userCanDelete && (
																				<Tooltip title="Delete Step">
																					<IconButton
																						size="small"
																						onClick={() => handleDeleteStep(step)}
																						className="text-rose-500 hover:bg-rose-50"
																					>
																						<FuseSvgIcon size={16}>
																							lucide:trash-2
																						</FuseSvgIcon>
																					</IconButton>
																				</Tooltip>
																			)}
																		</div>
																	)}
																</div>

																{/* Card Body */}
																<div className="p-3.5 sm:p-4 space-y-3">
																	{/* Uploaded Screenshot Box (Full width & Centered) */}
																	{hasScreenshot && (
																		<div className="w-full">
																			<div
																				onClick={() =>
																					setLightboxImage({
																						url: step.screenshotUrl!,
																						title: step.title || `Step ${stepNum}`
																					})
																				}
																				className="group relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950 cursor-zoom-in transition-all hover:border-primary-400 shadow-xs flex items-center justify-center p-2 sm:p-3"
																			>
																				<img
																					src={getImageUrl(step.screenshotUrl)}
																					alt={step.title || `Screenshot step ${stepNum}`}
																					className="w-full max-h-[620px] object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.01] rounded-lg"
																				/>
																				<div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-2xs rounded-xl">
																					<FuseSvgIcon size={18}>
																						lucide:maximize-2
																					</FuseSvgIcon>
																					<span>Click to view full screen</span>
																				</div>
																			</div>
																		</div>
																	)}

																	{/* Step Description & Inline Pasted Content */}
																	{step.description && (
																		<div
																			className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 dark:prose-invert leading-relaxed"
																			dangerouslySetInnerHTML={{ __html: step.description }}
																		/>
																	)}
																</div>
															</div>
														);
													})
												)}
											</div>
										</div>

										{/* "ON THIS PAGE" Navigation Panel (matching reference image) */}
										{selectedData.steps.length > 0 && (
											<aside className="hidden xl:block w-60 shrink-0 sticky top-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
												<div className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-2.5 px-2">
													ON THIS PAGE
												</div>
												<div className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
													{selectedData.steps.map((step, idx) => {
														const stepNum = step.stepOrder || idx + 1;
														const stepKey = step._id || `step-${stepNum}`;
														const isActive =
															activeStepId === stepKey ||
															activeStepId === `step-${stepNum}`;

														return (
															<button
																key={stepKey}
																type="button"
																onClick={() => scrollToStep(`step-${stepNum}`, stepKey)}
																className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all block truncate ${
																	isActive
																		? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-semibold shadow-2xs'
																		: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
																}`}
																title={step.title || `Step ${stepNum}`}
															>
																{step.title || `Step ${stepNum}`}
															</button>
														);
													})}
												</div>
											</aside>
										)}
									</div>
								) : selectedParent ? (
									/* Parent Category Overview */
									<div className="p-3 sm:p-4 space-y-3 w-full">
										<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden">
											<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
												<div className="space-y-1.5">
													<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
														<FuseSvgIcon size={14}>lucide:folder</FuseSvgIcon>
														<span>Parent Category</span>
													</div>
													<h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
														{selectedParent.title || selectedParent.moduleName}
													</h2>
													{selectedParent.description && (
														<p className="text-sm text-slate-600 dark:text-slate-400 pt-0.5 leading-relaxed">
															{selectedParent.description}
														</p>
													)}

													<div className="flex flex-wrap items-center gap-2 pt-1.5">
														<Tooltip
															title={
																isManageMode && userCanUpdate
																	? selectedParent.isPublished
																		? 'Click to unpublish'
																		: 'Click to publish'
																	: ''
															}
														>
															<Chip
																size="small"
																onClick={(e) => {
																	if (isManageMode && userCanUpdate) {
																		handleTogglePublish(selectedParent, e);
																	}
																}}
																label={
																	selectedParent.isPublished
																		? 'Published / Live'
																		: 'Draft Mode'
																}
																className={`text-xs font-medium ${
																	isManageMode && userCanUpdate
																		? 'cursor-pointer hover:opacity-85'
																		: ''
																} ${
																	selectedParent.isPublished
																		? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
																		: 'bg-amber-50 text-amber-700 border border-amber-200'
																}`}
															/>
														</Tooltip>
														<Chip
															size="small"
															label={`${selectedParent.children?.length || 0} Child Guides`}
															className="text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
														/>
													</div>
												</div>

												{isManageMode && (userCanCreate || userCanUpdate) && (
													<div className="flex items-center gap-2 shrink-0">
														{userCanCreate && (
															<Button
																variant="contained"
																size="small"
																onClick={() => {
																	setEditingModule(null);
																	setParentForNewChild(selectedParent);
																	setModuleDialogOpen(true);
																}}
																startIcon={<FuseSvgIcon size={16}>lucide:plus</FuseSvgIcon>}
																className="bg-primary-500 hover:bg-primary-600 text-white shadow-xs rounded-lg text-xs"
															>
																Add Child Guide
															</Button>
														)}
														{userCanUpdate && (
															<Button
																variant="outlined"
																size="small"
																onClick={() => {
																	setEditingModule(selectedParent);
																	setParentForNewChild(null);
																	setModuleDialogOpen(true);
																}}
																className="text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
															>
																Edit
															</Button>
														)}
													</div>
												)}
											</div>
										</div>

										{/* List of Child Guides under this Parent */}
										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<h3 className="text-base font-bold text-slate-900 dark:text-white">
													Guides in this Category
												</h3>
												{selectedParent.children && selectedParent.children.length > 0 && (
													<span className="text-xs text-slate-400">
														Click any guide to view its instructions
													</span>
												)}
											</div>

											{(!selectedParent.children ||
												selectedParent.children.length === 0) ? (
												<div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-6 sm:p-8 text-center space-y-2.5">
													<div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-slate-800 text-primary-500 flex items-center justify-center mx-auto">
														<FuseSvgIcon size={24}>lucide:folder-plus</FuseSvgIcon>
													</div>
													<h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
														No child guides added under &ldquo;{selectedParent.title}&rdquo; yet
													</h4>
													<p className="text-xs text-slate-500 max-w-md mx-auto">
														Parent categories group together child guide documents. Add a child guide
														to begin writing step-by-step instructions.
													</p>
													{isManageMode && userCanCreate && (
														<Button
															variant="contained"
															size="small"
															onClick={() => {
																setEditingModule(null);
																setParentForNewChild(selectedParent);
																setModuleDialogOpen(true);
															}}
															className="bg-primary-500 text-white text-xs mt-2"
														>
															+ Add First Child Guide to &ldquo;{selectedParent.title}&rdquo;
														</Button>
													)}
												</div>
											) : (
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
													{selectedParent.children.map((child) => (
														<div
															key={child._id || child.id}
															onClick={() => handleSelectChild(selectedParent, child)}
															className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 rounded-xl p-3.5 sm:p-4 cursor-pointer shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
														>
															<div className="space-y-2">
																<div className="flex items-center justify-between">
																	<div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
																		<FuseSvgIcon size={16}>lucide:file-text</FuseSvgIcon>
																	</div>
																	<span
																		className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
																			child.isPublished
																				? 'bg-emerald-50 text-emerald-700'
																				: 'bg-amber-50 text-amber-700'
																		}`}
																	>
																		{child.isPublished ? 'Live' : 'Draft'}
																	</span>
																</div>
																<h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
																	{child.title || child.moduleName}
																</h4>
																{child.description && (
																	<p className="text-xs text-slate-500 line-clamp-2">
																		{child.description}
																	</p>
																)}
															</div>

															<div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-primary-600 font-medium">
																<span>Open Guide</span>
																<FuseSvgIcon
																	size={14}
																	className="group-hover:translate-x-1 transition-transform"
																>
																	lucide:arrow-right
																</FuseSvgIcon>
															</div>
														</div>
													))}
												</div>
											)}
										</div>
									</div>
								) : (
									/* Nothing in tree */
									<div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
										<div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-slate-900 text-primary-500 dark:text-primary-400 flex items-center justify-center shadow-xs">
											<FuseSvgIcon size={32}>lucide:book-open</FuseSvgIcon>
										</div>
										<h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
											No Guides Available
										</h2>
										<p className="text-xs text-slate-500 max-w-sm">
											{isManageMode && userCanCreate
												? 'Create your first parent category to start documenting workflows.'
												: 'There are no published guide documents available at this time.'}
										</p>
										{isManageMode && userCanCreate && (
											<Button
												variant="contained"
												size="small"
												onClick={() => {
													setEditingModule(null);
													setParentForNewChild(null);
													setModuleDialogOpen(true);
												}}
												className="bg-primary-500 text-white text-xs"
											>
												Add Parent Category
											</Button>
										)}
									</div>
								)}
							</main>
						</div>
					</Paper>
				}
				scroll="content"
			/>

			{/* Dialogs */}
			{moduleDialogOpen && (
				<ModuleDialog
					open={moduleDialogOpen}
					onClose={() => {
						setModuleDialogOpen(false);
						setEditingModule(null);
						setParentForNewChild(null);
					}}
					editingModule={editingModule}
					parentModule={parentForNewChild}
					isAdminUser={isAdmin}
					defaultAdminSection={targetAdminSection}
				/>
			)}

			{lightboxImage && (
				<ImageLightboxDialog
					open={Boolean(lightboxImage)}
					imageUrl={lightboxImage.url}
					title={lightboxImage.title}
					onClose={() => setLightboxImage(null)}
				/>
			)}

			{/* Confirmation Dialog (matching UsersView styling for Delete & Status Change) */}
			<Dialog
				open={confirmState.open}
				onClose={() => !isActionLoading && setConfirmState((prev) => ({ ...prev, open: false }))}
				maxWidth="xs"
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: '16px',
						overflow: 'hidden',
						p: 0,
						boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
					}
				}}
			>
				<div className="p-6 pb-5 bg-white dark:bg-slate-900 flex items-start justify-between gap-4">
					<div className="flex items-start gap-3.5">
						<div
							className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
								confirmState.actionType === 'delete'
									? 'bg-red-100 text-red-500 dark:bg-red-950/50 dark:text-red-400'
									: confirmState.targetPublished
									? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
									: 'bg-amber-100 text-amber-500 dark:bg-amber-950/50 dark:text-amber-400'
							}`}
						>
							<FuseSvgIcon
								size={24}
								className={
									confirmState.actionType === 'delete'
										? 'text-red-500 dark:text-red-400'
										: confirmState.targetPublished
										? 'text-emerald-600 dark:text-emerald-400'
										: 'text-amber-500 dark:text-amber-400'
								}
							>
								{confirmState.actionType === 'delete'
									? 'heroicons-outline:trash'
									: confirmState.targetPublished
									? 'heroicons-outline:check-circle'
									: 'heroicons-outline:exclamation-triangle'}
							</FuseSvgIcon>
						</div>
						<div className="flex flex-col">
							<h3 className="text-base font-bold text-slate-800 dark:text-slate-100 m-0">
								{confirmState.title}
							</h3>
							<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed m-0">
								{confirmState.description}
							</p>
						</div>
					</div>
					<IconButton
						size="small"
						onClick={() => !isActionLoading && setConfirmState((prev) => ({ ...prev, open: false }))}
						className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 -mt-1 -mr-1"
					>
						<FuseSvgIcon size={18}>heroicons-outline:x-mark</FuseSvgIcon>
					</IconButton>
				</div>

				<div className="bg-slate-50/70 dark:bg-slate-800/50 px-6 py-3.5 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
					<button
						type="button"
						onClick={() => setConfirmState((prev) => ({ ...prev, open: false }))}
						disabled={isActionLoading}
						className="h-9 px-5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleConfirmAction}
						disabled={isActionLoading}
						className={`h-9 px-5 rounded-lg font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs border-0 flex items-center gap-1.5 text-white disabled:opacity-50 ${
							confirmState.actionType === 'delete'
								? 'bg-red-600 hover:bg-red-700'
								: confirmState.targetPublished
								? 'bg-emerald-600 hover:bg-emerald-700'
								: 'bg-amber-600 hover:bg-amber-700'
						}`}
					>
						{isActionLoading && <CircularProgress size={14} color="inherit" />}
						<span>
							{confirmState.actionType === 'delete'
								? 'Delete'
								: confirmState.targetPublished
								? 'Publish'
								: 'Unpublish'}
						</span>
					</button>
				</div>
			</Dialog>
		</>
	);
}
