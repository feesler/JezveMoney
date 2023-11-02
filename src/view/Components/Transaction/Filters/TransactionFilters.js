import { isFunction, asArray } from '@jezvejs/types';
import { createElement, show } from '@jezvejs/dom';
import { Component, debounce } from 'jezvejs';

// Application
import {
    __,
    formatDateRange,
    getHalfYearRange,
    getMonthRange,
    getWeekRange,
} from '../../../utils/utils.js';
import { App } from '../../../Application/App.js';

// Common components
import { AmountRangeField } from '../../Form/Fields/AmountRangeField/AmountRangeField.js';
import { TransactionTypeMenu } from '../../Form/Fields/TransactionTypeMenu/TransactionTypeMenu.js';
import { DateRangeField } from '../../Form/Fields/DateRangeField/DateRangeField.js';
import { FormControls } from '../../Form/FormControls/FormControls.js';
import { FilterSelect } from '../../Form/Inputs/FilterSelect/FilterSelect.js';
import { SearchInput } from '../../Form/Inputs/SearchInput/SearchInput.js';

import './TransactionFilters.scss';

/* CSS classes */
const CONTAINER_CLASS = 'filters-container';
const HEADER_CLASS = 'filters-heading';
const TITLE_CLASS = 'filters-heading__title';
const SEPARATOR_CLASS = 'filters-separator';
const FILTERS_CLASS = 'filters-list';
const FILTERS_ROW_CLASS = 'filters-row';
const FILTER_HEADER_CLASS = 'filter-item__title';

const FILTER_ITEM_CLASS = 'filter-item';
const TYPE_FILTER_CLASS = 'filter-item trans-type-filter';
const DATE_FILTER_CLASS = 'filter-item validation-block';
const AMOUNT_FILTER_CLASS = 'filter-item amount-range-filter validation-block';
const CONTROLS_CLASS = 'filters-controls';
const CLEAR_ALL_BUTTON_CLASS = 'clear-all-btn';

const filterHeader = (textContent) => (
    createElement('header', {
        props: {
            className: FILTER_HEADER_CLASS,
            textContent,
        },
    })
);

const filtersSeparator = () => (
    createElement('hr', { props: { className: SEPARATOR_CLASS } })
);

const filtersRow = (children) => (
    createElement('div', { props: { className: FILTERS_ROW_CLASS }, children })
);

const SEARCH_DELAY = 500;

const defaultProps = {
    id: 'filtersContainer',
    typeFilterId: 'typeFilter',
    accountsFilterId: 'accountsFilter',
    dateRangeFilterId: 'dateFilter',
    amountFilterId: 'amountFilter',
    searchFilterId: 'searchFilter',
    filter: {
        startDate: null,
        endDate: null,
    },
    getURL: null,
    onChangeTypeFilter: null,
    onAccountChange: null,
    onChangeDateRange: null,
    onChangeAmountFilter: null,
    onSearchInputChange: null,
    onApplyFilters: null,
    onClearAllFilters: null,
};

/**
 * Transactions list filter component
 */
export class TransactionFilters extends Component {
    static userProps = {
        elem: ['id'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            filter: {
                ...defaultProps.filter,
                ...(props.filter ?? {}),
            },
        });

        const filter = this.props.filter ?? {};

        this.state = {
            ...this.props,
            form: {
                ...filter,
                ...formatDateRange(filter),
            },
        };

        this.init();
        this.postInit();
        this.render(this.state);
    }

    init() {
        this.titleElem = createElement('header', {
            props: {
                className: TITLE_CLASS,
                textContent: __('filters.title'),
            },
        });
        this.headerElem = createElement('header', {
            props: { className: HEADER_CLASS },
            children: this.titleElem,
        });

        // Transaction type filter
        this.typeMenu = TransactionTypeMenu.create({
            id: 'typeMenu',
            multiple: true,
            allowActiveLink: true,
            showChangeLimit: true,
            onChange: (sel) => this.onChangeTypeFilter(sel),
        });

        this.typeFilter = createElement('section', {
            props: {
                id: this.props.typeFilterId,
                className: TYPE_FILTER_CLASS,
            },
            children: [
                filterHeader(__('filters.transactionType')),
                this.typeMenu.elem,
            ],
        });

        // Accounts and persons filter
        if (this.isAvailable()) {
            this.accountDropDown = FilterSelect.create({
                className: 'dd_fullwidth',
                placeholder: __('typeToFilter'),
                enableFilter: true,
                multiple: true,
                noResultsMessage: __('notFound'),
                onItemSelect: (obj) => this.onAccountChange(obj),
                onChange: (obj) => this.onAccountChange(obj),
            });
        }

        this.accountsFilter = createElement('section', {
            props: {
                id: this.props.accountsFilterId,
                className: FILTER_ITEM_CLASS,
            },
            children: [
                filterHeader(__('filters.accountsPersonsAndCategories')),
                this.accountDropDown?.elem,
            ],
        });
        show(this.accountsFilter, this.isAvailable());

        // Date range filter
        this.dateRangeFilter = DateRangeField.create({
            id: this.props.dateRangeFilterId,
            title: __('filters.dateRange'),
            input: {
                startPlaceholder: __('dateRange.from'),
                endPlaceholder: __('dateRange.to'),
            },
            className: DATE_FILTER_CLASS,
            onChange: (range) => this.onChangeDateRange(range),
        });

        // Amount range filter
        this.amountRangeFilter = AmountRangeField.create({
            id: 'amountRange',
            title: __('transactions.amount'),
            minPlaceholder: __('amountRange.from'),
            maxPlaceholder: __('amountRange.to'),
            onChange: (data) => this.onChangeAmountFilter(data),
        });

        this.amountFilter = createElement('section', {
            props: {
                id: this.props.amountFilterId,
                className: AMOUNT_FILTER_CLASS,
            },
            children: this.amountRangeFilter.elem,
        });

        // Search query filter
        // Search input
        this.searchInput = SearchInput.create({
            placeholder: __('typeToFilter'),
            onChange: debounce((val) => this.onSearchInputChange(val), SEARCH_DELAY),
        });
        this.searchFilter = createElement('section', {
            props: {
                id: this.props.searchFilterId,
                className: FILTER_ITEM_CLASS,
            },
            children: [
                filterHeader(__('filters.search')),
                this.searchInput.elem,
            ],
        });

        this.filtersElem = createElement('div', {
            props: { className: FILTERS_CLASS },
            children: [
                filtersRow([
                    this.typeFilter,
                    filtersSeparator(),
                    this.accountsFilter,
                ]),
                filtersSeparator(),
                filtersRow([
                    this.dateRangeFilter.elem,
                    filtersSeparator(),
                    this.amountFilter,
                    filtersSeparator(),
                    this.searchFilter,
                ]),
                filtersSeparator(),
            ],
        });

        // Controls
        const clearAllURL = App.getURL('transactions/');
        this.controls = FormControls.create({
            className: CONTROLS_CLASS,
            submitBtn: {
                title: __('actions.apply'),
                onClick: (e) => this.onApplyFilters(e),
            },
            cancelBtn: {
                title: __('actions.clearAll'),
                className: CLEAR_ALL_BUTTON_CLASS,
                url: clearAllURL.toString(),
                onClick: (e) => this.onClearAllFilters(e),
            },
        });

        // Container
        this.elem = createElement('aside', {
            props: { className: CONTAINER_CLASS },
            children: [
                this.headerElem,
                filtersSeparator(),
                this.filtersElem,
                this.controls.elem,
            ],
        });
    }

    postInit() {
        this.setClassNames();
        this.setUserProps();
    }

    /** Returns true if accounts or persons is available */
    isAvailable() {
        const { accounts, persons } = App.model;
        return (accounts.length > 0 || persons.length > 0);
    }

    onChangeTypeFilter(selected) {
        if (isFunction(this.props.onChangeTypeFilter)) {
            this.props.onChangeTypeFilter(selected);
        }
    }

    onAccountChange(selected) {
        if (isFunction(this.props.onAccountChange)) {
            this.props.onAccountChange(selected);
        }
    }

    onChangeDateRange(range) {
        if (isFunction(this.props.onChangeDateRange)) {
            this.props.onChangeDateRange(range);
        }
    }

    onChangeAmountFilter(range) {
        if (isFunction(this.props.onChangeAmountFilter)) {
            this.props.onChangeAmountFilter(range);
        }
    }

    showWeekRange(e) {
        e.preventDefault();

        const range = getWeekRange();
        this.onChangeDateRange(formatDateRange(range));
    }

    showMonthRange(e) {
        e.preventDefault();

        const range = getMonthRange();
        this.onChangeDateRange(formatDateRange(range));
    }

    showHalfYearRange(e) {
        e.preventDefault();

        const range = getHalfYearRange();
        this.onChangeDateRange(formatDateRange(range));
    }

    onSearchInputChange(value) {
        if (isFunction(this.props.onSearchInputChange)) {
            this.props.onSearchInputChange(value);
        }
    }

    onApplyFilters(e) {
        if (isFunction(this.props.onApplyFilters)) {
            this.props.onApplyFilters(e);
        }
    }

    onClearAllFilters(e) {
        if (isFunction(this.props.onClearAllFilters)) {
            this.props.onClearAllFilters(e);
        }
    }

    /** Returns URL for specified state */
    getURL(state, keepPage = true) {
        return isFunction(this.props.getURL)
            ? this.props.getURL(state, keepPage)
            : '';
    }

    renderTypeFilter(state) {
        const filterURL = this.getURL(state, false);

        this.typeMenu.setURL(filterURL.toString());
        this.typeMenu.setSelection(state.form.type);
    }

    /** Render accounts and persons selection */
    renderAccountsFilter(state) {
        if (!this.isAvailable()) {
            return;
        }

        const idsToSelect = [
            ...asArray(state.form.accounts).map((id) => `a${id}`),
            ...asArray(state.form.persons).map((id) => `p${id}`),
            ...asArray(state.form.categories).map((id) => `c${id}`),
        ];

        this.accountDropDown.setSelection(idsToSelect);
    }

    renderDateRangeFilter(state, prevState) {
        if (
            state.filter === prevState?.filter
            && state.form === prevState?.form
            && state.form.startDate === prevState?.form?.startDate
            && state.form.endDate === prevState?.form?.endDate
        ) {
            return;
        }

        const dateFilterURL = this.getURL(state, false);
        const weekRange = getWeekRange();
        dateFilterURL.searchParams.set('startDate', weekRange.startDate);
        dateFilterURL.searchParams.set('endDate', weekRange.endDate);
        const weekRangeURL = dateFilterURL.toString();

        const monthRange = getMonthRange();
        dateFilterURL.searchParams.set('startDate', monthRange.startDate);
        const monthRangeURL = dateFilterURL.toString();

        const halfYearRange = getHalfYearRange();
        dateFilterURL.searchParams.set('startDate', halfYearRange.startDate);
        const halfYearRangeURL = dateFilterURL.toString();

        this.dateRangeFilter.setState((rangeState) => ({
            ...rangeState,
            startDate: state.form.startDate,
            endDate: state.form.endDate,
            headerButtons: [{
                dataValue: 'week',
                title: __('dateRange.forWeek'),
                url: weekRangeURL,
                onClick: (e) => this.showWeekRange(e),
            }, {
                dataValue: 'month',
                title: __('dateRange.forMonth'),
                url: monthRangeURL,
                onClick: (e) => this.showMonthRange(e),
            }, {
                dataValue: 'halfyear',
                title: __('dateRange.forHalfYear'),
                url: halfYearRangeURL,
                onClick: (e) => this.showHalfYearRange(e),
            }],
        }));
    }

    /** Renders amount range filter */
    renderAmountRangeFilter(state, prevState) {
        if (
            state.filter === prevState?.filter
            && state.form === prevState?.form
            && state.form.minAmount === prevState?.form?.minAmount
            && state.form.maxAmount === prevState?.form?.maxAmount
        ) {
            return;
        }

        this.amountRangeFilter.setData({
            minAmount: state.form.minAmount,
            maxAmount: state.form.maxAmount,
        });
    }

    renderSearchForm(state) {
        this.searchInput.value = state.form.search ?? '';
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderTypeFilter(state, prevState);
        this.renderAccountsFilter(state, prevState);
        this.renderDateRangeFilter(state, prevState);
        this.renderAmountRangeFilter(state, prevState);
        this.renderSearchForm(state, prevState);
    }
}
