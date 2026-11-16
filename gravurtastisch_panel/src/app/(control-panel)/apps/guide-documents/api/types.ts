export interface GuideStep {
	_id?: string;
	id?: string;
	guideModuleId: string;
	title?: string;
	description?: string;
	screenshotUrl?: string;
	stepOrder: number;
	status?: number;
	created_by?: any;
	updated_by?: any;
	createdAt?: string;
	updatedAt?: string;
}

export interface GuideModule {
	_id?: string;
	id?: string;
	title: string;
	moduleName?: string;
	description?: string;
	parentId?: string | null;
	sortOrder: number;
	isPublished: boolean;
	isAdminSection: boolean;
	status: number;
	children?: GuideModule[];
	steps?: GuideStep[];
	created_by?: any;
	updated_by?: any;
	createdAt?: string;
	updatedAt?: string;
}

export interface PublishedChildDetails {
	parent: GuideModule;
	module: GuideModule;
	steps: GuideStep[];
}

export interface CreateModulePayload {
	title: string;
	moduleName?: string;
	description?: string;
	parentId?: string | null;
	sortOrder?: number;
	isPublished?: boolean;
	isAdminSection?: boolean;
}

export interface UpdateModulePayload {
	title?: string;
	moduleName?: string;
	description?: string;
	parentId?: string | null;
	sortOrder?: number;
	isPublished?: boolean;
	isAdminSection?: boolean;
	status?: number;
}

export interface CreateStepPayload {
	title?: string;
	description?: string;
	screenshotUrl?: string;
	stepOrder: number;
}

export interface UpdateStepPayload {
	title?: string;
	description?: string;
	screenshotUrl?: string;
	stepOrder?: number;
	status?: number;
}

export interface UploadScreenshotResponse {
	status: number;
	message: string;
	data: {
		relativePath: string;
		filename: string;
		url: string;
		screenshotUrl: string;
	};
}
