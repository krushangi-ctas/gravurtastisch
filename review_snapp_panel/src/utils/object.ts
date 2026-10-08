export const _has = (obj: Record<string, any>, key: string): boolean => {
	return Object.prototype.hasOwnProperty.call(obj, key);
};

export const _every = <T>(array: T[], predicate: (item: T) => boolean): boolean => {
	for (const item of array) {
		if (!predicate(item)) return false;
	}
	return true;
};

export const _some = <T>(array: T[], predicate: (item: T) => boolean): boolean => {
	for (const item of array) {
		if (predicate(item)) return true;
	}
	return false;
};

export const _isObject = (value: unknown): value is Record<string, any> => {
	return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0;
};

export const _isArray = <T = unknown>(value: unknown): value is T[] => {
	return Array.isArray(value) && value.length > 0;
};

export const _isEmpty = (value: unknown): boolean => {
	return typeof value === 'object' && !(_isObject(value) || _isArray(value));
};

export const _isSameKind = (value: unknown, value2: unknown): boolean => {
	return typeof value === typeof value2 && _isArray(value) === _isArray(value2);
};

export const _get = <T = unknown, D = undefined>(
	obj: Record<string, any> | null | undefined,
	path: string | (string | number)[],
	defaultValue?: D
): T | D => {
	if (obj == null) return defaultValue as D;

	const pathArray = Array.isArray(path)
		? path
		: path
				.replace(/\[(\d+)]/g, '.$1')
				.split('.')
				.filter(Boolean);

	let result: any = obj;

	for (const key of pathArray) {
		if (result != null && Object.prototype.hasOwnProperty.call(result, key)) {
			result = result[key];
		} else {
			return defaultValue as D;
		}
	}

	return result as T;
};

export const _groupBy = <T = any>(
	array: T[],
	iteratee: ((item: T) => string | number) | string
): Record<string, T[]> => {
	const result: Record<string, T[]> = {};

	if (!_isArray(array)) return result;

	for (const item of array) {
		let key: string | number;

		if (typeof iteratee === 'function') {
			key = iteratee(item);
		} else if (typeof iteratee === 'string') {
			key = _get(item, iteratee, '') as string;
		} else {
			continue;
		}

		const safeKey = String(key);

		if (!result[safeKey]) result[safeKey] = [];

		result[safeKey].push(item);
	}

	return result;
};
