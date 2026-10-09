/**
 * @description Removes all whitespace from the expression
 */
export const cleanExpression = (expr: string): string => expr.replace(/\s+/g, '');

/**
 * @description Validates a formula expression and returns [isValid, errorMessage]
 */
export const isValidFormulaExpression = (expression: string, expectedVar: string): [boolean, string] => {
	if (typeof expression !== 'string' || !expression.trim()) return [false, 'Expression is empty'];

	try {
		const cleanedExpr = cleanExpression(expression);

		const [validExpression, expressionErr] = hasPercentageSign(cleanedExpr);

		if (!validExpression) return [false, expressionErr];

		const [validVar, varErr] = hasOnlyExpectedVariable(cleanedExpr, expectedVar);

		if (!validVar) return [false, varErr];

		const [validPercent, percentErr] = isValidPercentUsage(cleanedExpr);

		if (!validPercent) return [false, percentErr];

		const [balanced, parenErr] = hasBalancedParentheses(cleanedExpr);

		if (!balanced) return [false, parenErr];

		const [validChars, charErr] = hasOnlyValidCharacters(cleanedExpr, expectedVar);

		if (!validChars) return [false, charErr];

		return [true, ''];
	} catch {
		return [false, 'Unexpected error during formula validation'];
	}
};

/**
 * @helper
 * @description Checks if the expression only includes the expected variable (no others)
 */
const hasOnlyExpectedVariable = (expr: string, expectedVar: string): [boolean, string] => {
	const allVars = [...expr.matchAll(/[a-zA-Z_][a-zA-Z0-9_]*/g)].map((v) => v[0]);
	const invalidVars = allVars.filter((v) => v !== expectedVar);

	if (invalidVars.length > 0) {
		return [false, `Invalid variable(s) used: ${invalidVars.join(', ')}`];
	}

	return [true, ''];
};

/**
 * @helper
 * @description Validates that % usage is syntactically correct and not misused
 */
const isValidPercentUsage = (expr: string): [boolean, string] => {
	const percentMatches = [...expr.matchAll(/%/g)];
	for (const match of percentMatches) {
		const before = expr[match.index! - 1];

		if (!before || !/\d/.test(before)) {
			return [false, 'Invalid % usage: must come after a number'];
		}
	}

	if (expr.match(/%[+\-*/]/)) return [false, 'Operators are not allowed immediately after %'];

	return [true, ''];
};

/**
 * @helper
 * @description Checks for balanced parentheses in the expression
 */
const hasBalancedParentheses = (expr: string): [boolean, string] => {
	let balance = 0;
	for (const ch of expr) {
		if (ch === '(') balance++;

		if (ch === ')') balance--;

		if (balance < 0) return [false, 'Unbalanced parentheses'];
	}
	return balance === 0 ? [true, ''] : [false, 'Unbalanced parentheses'];
};

/**
 * @helper
 * @description Ensures only valid characters are used (digits, ops, %, (), variable name)
 */
const hasOnlyValidCharacters = (expr: string, expectedVar: string): [boolean, string] => {
	const safeExpr = expr.replace(new RegExp(expectedVar, 'g'), '');

	if (!/^[-+*/().0-9a-zA-Z_]*$/.test(safeExpr)) {
		return [false, 'Invalid characters found in formula'];
	}

	if (/[\\+\-\\*\\/]{2,}/.test(expr)) {
		return [false, 'Repeated operators like ++ or ** are not allowed'];
	}

	return [true, ''];
};

/**
 * @helper
 * @description Ensures the expression does not contain percentage signs (%)
 */
const hasPercentageSign = (expr: string): [boolean, string] => {
	if (expr.includes('%')) {
		return [
			false,
			'Percentage (%) is not allowed in formulas. Please use valid mathematical expressions like instead of (value + 20 + 10%) use  ((value + 20) * 10 / 100) .'
		];
	}

	return [true, ''];
};
