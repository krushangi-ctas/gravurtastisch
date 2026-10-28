export interface SystemLog {
	_id: string;
	operation: 'CREATE' | 'UPDATE' | 'DELETE' | string;
	operation_by?: string;
	key: string;
	scope: 'admin' | 'seller' | string;
	ip_address?: string;
	first_name?: string;
	last_name?: string;
	name?: string;
	email?: string;
	role_name?: string;
	operation_data?: Record<string, any> | any;
	existing_data?: Record<string, any> | any;
	createdAt: string;
	updatedAt?: string;
}

export interface SystemLogQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	sortBy?: string;
	startDate?: string;
	endDate?: string;
	scope?: 'admin' | 'seller' | string;
	role?: string;
	operation?: string;
	operation_by?: string;
}

export interface SystemLogPagination {
	length: number;
	size: number;
	page: number;
	lastPage: number;
	totalResults?: number;
	total?: number;
	totalPages?: number;
}

export interface SystemLogResponse {
	status: number;
	message: string;
	data: SystemLog[];
	pagination: SystemLogPagination;
}

export interface OperationItem {
	_id: string;
	operation: string;
}

export interface OperationListResponse {
	status: number;
	message: string;
	data: OperationItem[];
}
