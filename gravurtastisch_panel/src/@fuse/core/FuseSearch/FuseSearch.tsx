import ClickAwayListener from '@mui/material/ClickAwayListener';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
// import Popper from '@mui/material/Popper';
import Tooltip from '@mui/material/Tooltip';
import match from 'autosuggest-highlight/match';
import clsx from 'clsx';
import _ from 'lodash';
import { memo, useEffect, useReducer, useRef, ReactNode } from 'react';
import { ChangeEvent } from 'react-autosuggest';
import * as React from 'react';
import useNavigate from '@fuse/hooks/useNavigate';
import FuseSvgIcon from '../FuseSvgIcon';
import { FuseFlatNavItemType } from '../FuseNavigation/types/FuseNavItemType';

const Root = styled('div')(({ theme }) => ({
	'& .FuseSearch-container': {
		position: 'relative'
	},
	'& .FuseSearch-suggestionsContainerOpen': {
		position: 'absolute',
		zIndex: 1,
		marginTop: theme.spacing(),
		left: 0,
		right: 0
	},
	'& .FuseSearch-suggestion': {
		display: 'block'
	},
	'& .FuseSearch-suggestionsList': {
		margin: 0,
		padding: 0,
		listStyleType: 'none'
	},
	'& .FuseSearch-input': {
		transition: theme.transitions.create(['background-color'], {
			easing: theme.transitions.easing.easeInOut,
			duration: theme.transitions.duration.short
		}),
		'&:focus': {
			backgroundColor: theme.vars.palette.background.paper
		}
	}
}));



function getSuggestions(value: string, data: FuseFlatNavItemType[]): FuseFlatNavItemType[] {
	const inputValue = _.deburr(value.trim()).toLowerCase();
	const inputLength = inputValue.length;
	let count = 0;

	if (inputLength === 0) {
		return [];
	}

	return data.filter((suggestion) => {
		const keep = count < 10 && suggestion?.title && match(suggestion?.title, inputValue)?.length > 0;

		if (keep) {
			count += 1;
		}

		return keep;
	});
}



type StateType = {
	searchText: string;
	search: boolean;
	navigation: FuseFlatNavItemType[];
	suggestions: FuseFlatNavItemType[];
	noSuggestions: boolean;
	opened: boolean;
};

const initialState: StateType = {
	searchText: '',
	search: false,
	navigation: [],
	suggestions: [],
	noSuggestions: false,
	opened: false
};

type ActionType =
	| { type: 'setSearchText'; value: string }
	| { type: 'setNavigation'; data: FuseFlatNavItemType[] }
	| { type: 'updateSuggestions'; value: string }
	| { type: 'clearSuggestions' }
	| { type: 'open' }
	| { type: 'close' };

function reducer(state: StateType, action: ActionType): StateType {
	switch (action.type) {
		case 'open': {
			return {
				...state,
				opened: true
			};
		}
		case 'close': {
			return {
				...state,
				opened: false,
				searchText: ''
			};
		}
		case 'setSearchText': {
			return {
				...state,
				searchText: action.value
			};
		}
		case 'setNavigation': {
			return {
				...state,
				navigation: action.data
			};
		}
		case 'updateSuggestions': {
			const suggestions = getSuggestions(action.value, state.navigation);
			const isInputBlank = typeof action.value === 'string' && action.value.trim() === '';
			const noSuggestions = !isInputBlank && suggestions.length === 0;

			return {
				...state,
				suggestions,
				noSuggestions
			};
		}
		case 'clearSuggestions': {
			return {
				...state,
				suggestions: [],
				noSuggestions: false
			};
		}
		default: {
			throw new Error();
		}
	}
}

/**
 * Props for FuseSearch component
 */
type FuseSearchProps = {
	className?: string;
	navigation: FuseFlatNavItemType[];
	variant?: 'basic' | 'full';
	trigger?: ReactNode;
	placeholder?: string;
	noResults?: string;
};

/**
 * FuseSearch component
 */
function FuseSearch(props: FuseSearchProps) {
	const {
		navigation = [],
		className,
		variant = 'full',
		placeholder = 'Search',
		noResults = 'No results..',
		trigger = (
			<IconButton>
				<FuseSvgIcon>lucide:search</FuseSvgIcon>
			</IconButton>
		)
	} = props;
	const navigate = useNavigate();

	const [state, dispatch] = useReducer(reducer, initialState);

	const suggestionsNode = useRef<HTMLDivElement>(null);
	const popperNode = useRef<HTMLDivElement>(null);
	const buttonNode = useRef(null);

	useEffect(() => {
		dispatch({
			type: 'setNavigation',
			data: navigation
		});
	}, [navigation]);

	function showSearch() {
		dispatch({ type: 'open' });
		document.addEventListener('keydown', escFunction, false);
	}

	function hideSearch() {
		dispatch({ type: 'close' });
		document.removeEventListener('keydown', escFunction, false);
	}

	function escFunction(event: KeyboardEvent) {
		if (event.key === 'Esc' || event.key === 'Escape') {
			hideSearch();
		}
	}

	function handleSuggestionsFetchRequested({ value }: { value: string }) {
		dispatch({
			type: 'updateSuggestions',
			value
		});
	}

	function handleSuggestionSelected(
		event: React.FormEvent<unknown>,
		{ suggestion }: { suggestion: FuseFlatNavItemType }
	) {
		event.preventDefault();
		event.stopPropagation();

		if (!suggestion.url) {
			return;
		}

		hideSearch();

		navigate(suggestion.url);
	}

	function handleSuggestionsClearRequested() {
		dispatch({
			type: 'clearSuggestions'
		});
	}

	function handleChange(_event: React.FormEvent<HTMLElement>, { newValue }: ChangeEvent) {
		dispatch({
			type: 'setSearchText',
			value: newValue
		});
	}

	function handleClickAway(event: MouseEvent | TouchEvent) {
		if (
			state.opened &&
			(!suggestionsNode.current ||
				!(event.target instanceof Node && suggestionsNode.current.contains(event.target)))
		) {
			hideSearch();
		}
	}

	switch (variant) {
		case 'basic': {
			return (
				<div
					className={clsx('flex w-full items-center', className)}
					ref={popperNode}
				>
					{ }
				</div>
			);
		}
		case 'full': {
			return (
				<Root className={clsx('flex', className)}>
					<Tooltip
						title="Click to search"
						placement="bottom"
					>
						<div
							onClick={showSearch}
							onKeyDown={showSearch}
							role="button"
							tabIndex={0}
							ref={buttonNode}
						>
							{trigger}
						</div>
					</Tooltip>

					{state.opened && (
						<ClickAwayListener onClickAway={handleClickAway}>
							<Paper
								className="shadow-0 absolute inset-x-0 top-0 z-9999 h-full"
								square
							>
								<div
									className="flex h-full w-full items-center"
									ref={popperNode}
								>
									{/* <Autosuggest
										renderInputComponent={renderInputComponent}
										highlightFirstSuggestion
										suggestions={state.suggestions}
										onSuggestionsFetchRequested={handleSuggestionsFetchRequested}
										onSuggestionsClearRequested={handleSuggestionsClearRequested}
										onSuggestionSelected={handleSuggestionSelected}
										getSuggestionValue={getSuggestionValue}
										renderSuggestion={renderSuggestion}
										inputProps={{
											placeholder,
											value: state.searchText,
											onChange: handleChange,
											// eslint-disable-next-line @typescript-eslint/ban-ts-comment
											// @ts-ignore
											InputLabelProps: {
												shrink: true
											},
											autoFocus: true
										}}
										theme={{
											container: 'flex flex-1 w-full',
											suggestionsList: 'FuseSearch-suggestionsList',
											suggestion: 'FuseSearch-suggestion'
										}}
										renderSuggestionsContainer={(options) => {
											const { containerProps } = options;
											const { key, ...restContainerProps } = containerProps;

											return (
												<Popper
													anchorEl={popperNode.current}
													open={Boolean(options.children) || state.noSuggestions}
													className="z-9999"
												>
													<div ref={suggestionsNode}>
														<Paper
															square
															key={key}
															{...restContainerProps}
															className="shadow-lg"
															style={{
																width: popperNode.current
																	? popperNode.current.clientWidth
																	: 'auto'
															}}
														>
															{options.children}
															{state.noSuggestions && (
																<Typography className="px-4 py-3">
																	{noResults}
																</Typography>
															)}
														</Paper>
													</div>
												</Popper>
											);
										}}
									/> */}
									<IconButton
										onClick={hideSearch}
										className="mx-2"
										size="large"
									>
										<FuseSvgIcon>lucide:x</FuseSvgIcon>
									</IconButton>
								</div>
							</Paper>
						</ClickAwayListener>
					)}
				</Root>
			);
		}
		default: {
			return null;
		}
	}
}

export default memo(FuseSearch);
