import { isFunction } from '@jezvejs/types';
import { Component } from 'jezvejs';
import { createElement, show } from '@jezvejs/dom';
import { DropDown } from 'jezvejs/DropDown';
import { LinkMenu } from 'jezvejs/LinkMenu';

// Application
import {
    __,
    dateStringToTime,
    formatDateRange,
    getHalfYearRange,
    getMonthRange,
    getWeekRange,
} from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';

// Common components
import { FieldHeaderButton } from '../../../../Components/Form/Fields/FieldHeaderButton/FieldHeaderButton.js';
import { TransactionTypeMenu } from '../../../../Components/Form/Fields/TransactionTypeMenu/TransactionTypeMenu.js';
import { FormControls } from '../../../../Components/Form/FormControls/FormControls.js';
import { DateRangeInput } from '../../../../Components/Form/Inputs/Date/DateRangeInput/DateRangeInput.js';
import { CategorySelect } from '../../../../Components/Category/CategorySelect/CategorySelect.js';

import './StatisticsFilters.scss';

/* CSS classes */
const CONTAINER_CLASS = 'filters-container';
const HEADER_CLASS = 'filters-heading';
const TITLE_CLASS = 'filters-heading__title';
const SEPARATOR_CLASS = 'filters-separator';
const FILTERS_CLASS = 'filters-list';
const FILTERS_ROW_CLASS = 'filters-row';
const FILTER_HEADER_CLASS = 'filter-item__title';

const TYPE_FILTER_CLASS = 'filter-item trans-type-filter';
const REPORT_FILTER_CLASS = 'filter-item report-type-filter';
const GROUP_FILTER_CLASS = 'filter-item group-type-filter';
const CURRENCY_FILTER_CLASS = 'filter-item currency-filter';
const ACCOUNTS_FILTER_CLASS = 'filter-item accounts-filter';
const CATEGORIES_FILTER_CLASS = 'filter-item category-filter';
const DATE_FILTER_CLASS = 'filter-item date-range-filter validation-block';
const CONTROLS_CLASS = 'filters-controls';

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

const defaultProps = {
    id: 'filtersContainer',
    typeFilterId: 'typeFilter',
    reportTypeFilterId: 'reportTypeFilter',
    groupTypeFilterId: 'groupTypeFilter',
    accountsFilterId: 'accountsFilter',
    categoriesFilterId: 'categoriesFilter',
    currencyFilterId: 'currencyFilter',
    dateRangeFilterId: 'dateFilter',
    groupTypes: {},
    filter: {
        startDate: null,
        endDate: null,
    },
    getURL: null,
    onChangeTypeFilter: null,
    onSelectReportType: null,
    onSelectGroupType: null,
    onAccountsChange: null,
    onCategoriesChange: null,
    onCurrencyChange: null,
    onChangeDateRange: null,
    onApplyFilters: null,
};

/**
 * Statistics filter component
 */
export class StatisticsFilters extends Component {
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
            showAll: false,
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

        // Report type filter
        this.reportMenu = LinkMenu.create({
            id: 'reportMenu',
            itemParam: 'report',
            items: [
                { id: 'category', title: __('statistics.reports.categories') },
                { id: 'account', title: __('statistics.reports.accounts') },
                { id: 'currency', title: __('statistics.reports.currencies') },
            ],
            onChange: (value) => this.onSelectReportType(value),
        });
        this.reportTypeFilter = createElement('section', {
            props: {
                id: this.props.reportTypeFilterId,
                className: REPORT_FILTER_CLASS,
            },
            children: [
                filterHeader(__('statistics.reportType')),
                this.reportMenu.elem,
            ],
        });

        // 'Group by' filter
        const { groupTypes } = this.props;
        this.groupTypeMenu = LinkMenu.create({
            id: 'groupTypeMenu',
            itemParam: 'group',
            items: Object.values(groupTypes).map(({ name, title }) => ({
                id: name,
                title,
            })),
            onChange: (value) => this.onSelectGroupType(value),
        });
        this.groupTypeFilter = createElement('section', {
            props: {
                id: this.props.groupTypeFilterId,
                className: GROUP_FILTER_CLASS,
            },
            children: [
                filterHeader(__('statistics.groupBy')),
                this.groupTypeMenu.elem,
            ],
        });

        // Currency filter
        this.currencyDropDown = DropDown.create({
            elem: 'curr_id',
            enableFilter: true,
            onItemSelect: (obj) => this.onCurrencyChange(obj),
            className: 'dd_fullwidth',
        });
        App.initUserCurrencyList(this.currencyDropDown);

        this.currencyFilter = createElement('section', {
            props: {
                id: this.props.currencyFilterId,
                className: CURRENCY_FILTER_CLASS,
            },
            children: [
                filterHeader(__('statistics.currency')),
                this.currencyDropDown.elem,
            ],
        });

        // Accounts filter
        this.accountDropDown = DropDown.create({
            elem: 'acc_id',
            multiple: true,
            placeholder: __('typeToFilter'),
            enableFilter: true,
            noResultsMessage: __('notFound'),
            onItemSelect: (obj) => this.onAccountsChange(obj),
            onChange: (obj) => this.onAccountsChange(obj),
            className: 'dd_fullwidth',
        });
        App.initAccountsList(this.accountDropDown);
        this.accountsFilter = createElement('section', {
            props: {
                id: this.props.accountsFilterId,
                className: ACCOUNTS_FILTER_CLASS,
            },
            children: [
                filterHeader(__('statistics.account')),
                this.accountDropDown.elem,
            ],
        });

        // Categories filter
        this.categoryDropDown = CategorySelect.create({
            elem: 'category_id',
            multiple: true,
            placeholder: __('typeToFilter'),
            enableFilter: true,
            noResultsMessage: __('notFound'),
            onItemSelect: (obj) => this.onCategoriesChange(obj),
            onChange: (obj) => this.onCategoriesChange(obj),
            className: 'dd_fullwidth',
        });
        this.categoriesFilter = createElement('section', {
            props: {
                id: this.props.categoriesFilterId,
                className: CATEGORIES_FILTER_CLASS,
            },
            children: [
                filterHeader(__('filters.categories')),
                this.categoryDropDown.elem,
            ],
        });

        // Date range filter
        this.dateRangeFilterTitle = createElement('span', {
            props: { textContent: __('filters.dateRange') },
        });

        this.weekRangeBtn = FieldHeaderButton.create({
            dataValue: 'week',
            title: __('dateRange.forWeek'),
            onClick: (e) => this.showWeekRange(e),
        });

        this.monthRangeBtn = FieldHeaderButton.create({
            dataValue: 'month',
            title: __('dateRange.forMonth'),
            onClick: (e) => this.showMonthRange(e),
        });

        this.halfYearRangeBtn = FieldHeaderButton.create({
            dataValue: 'halfyear',
            title: __('dateRange.forHalfYear'),
            onClick: (e) => this.showHalfYearRange(e),
        });

        this.dateRangeHeader = createElement('header', {
            props: { className: FILTER_HEADER_CLASS },
            children: [
                this.dateRangeFilterTitle,
                this.weekRangeBtn.elem,
                this.monthRangeBtn.elem,
                this.halfYearRangeBtn.elem,
            ],
        });

        this.dateRangeFilter = DateRangeInput.create({
            id: 'dateFrm',
            startPlaceholder: __('dateRange.from'),
            endPlaceholder: __('dateRange.to'),
            onChange: (range) => this.onChangeDateRange(range),
        });
        this.dateFilter = createElement('section', {
            props: {
                id: this.props.dateRangeFilterId,
                className: DATE_FILTER_CLASS,
            },
            children: [
                this.dateRangeHeader,
                this.dateRangeFilter.elem,
            ],
        });

        this.filtersElem = createElement('div', {
            props: { className: FILTERS_CLASS },
            children: [
                filtersRow([
                    this.typeFilter,
                    filtersSeparator(),
                    this.reportTypeFilter,
                    filtersSeparator(),
                    this.groupTypeFilter,
                ]),
                filtersSeparator(),
                filtersRow([
                    this.accountsFilter,
                    filtersSeparator(),
                    this.categoriesFilter,
                    filtersSeparator(),
                    this.currencyFilter,
                    filtersSeparator(),
                    this.dateFilter,
                ]),
                filtersSeparator(),
            ],
        });

        // Controls
        this.controls = FormControls.create({
            className: CONTROLS_CLASS,
            submitBtn: {
                title: __('actions.apply'),
                onClick: (e) => this.onApplyFilters(e),
            },
            cancelBtn: false,
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

    onSelectReportType(selected) {
        if (isFunction(this.props.onSelectReportType)) {
            this.props.onSelectReportType(selected);
        }
    }

    onSelectGroupType(selected) {
        if (isFunction(this.props.onSelectGroupType)) {
            this.props.onSelectGroupType(selected);
        }
    }

    onAccountsChange(selected) {
        if (isFunction(this.props.onAccountsChange)) {
            this.props.onAccountsChange(selected);
        }
    }

    onCategoriesChange(selected) {
        if (isFunction(this.props.onCategoriesChange)) {
            this.props.onCategoriesChange(selected);
        }
    }

    onCurrencyChange(selected) {
        if (isFunction(this.props.onCurrencyChange)) {
            this.props.onCurrencyChange(selected);
        }
    }

    onChangeDateRange(range) {
        if (isFunction(this.props.onChangeDateRange)) {
            this.props.onChangeDateRange(range);
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

    /** Returns URL for specified state */
    getURL(state) {
        return isFunction(this.props.getURL)
            ? this.props.getURL(state)
            : '';
    }

    renderTypeFilter(state) {
        const filterURL = this.getURL(state);
        this.typeMenu.setURL(filterURL.toString());
        this.typeMenu.setSelection(state.form.type);
    }

    renderReportTypeFilter(state) {
        this.reportMenu.setSelection(state.form.report);
    }

    renderGroupTypeFilter(state) {
        this.groupTypeMenu.setSelection(state.form.group);
    }

    renderAccountsFilter(state, prevState) {
        if (
            state.form?.accounts === prevState?.form?.accounts
            && state.chartCurrency === prevState?.chartCurrency
            && state.form?.report === prevState?.form?.report
        ) {
            return;
        }

        show(this.accountsFilter, (state.form?.report === 'account'));

        const ids = state.form?.accounts ?? [];
        const selection = [];

        App.model.userAccounts.forEach((account) => {
            const enable = (
                state.chartCurrency === 0
                || ids.length === 0
                || account.curr_id === state.chartCurrency
            );
            this.accountDropDown.enableItem(account.id, enable);

            if (enable && ids.includes(account.id)) {
                selection.push(account.id);
            }
        });

        this.accountDropDown.setSelection(selection);
    }

    renderCategoriesFilter(state) {
        show(this.categoriesFilter, (state.form?.report === 'category'));

        const ids = state.form?.categories ?? [];
        this.categoryDropDown.setSelection(ids);
    }

    renderCurrencyFilter(state) {
        show(this.currencyFilter, (state.form?.report === 'currency'));

        if (state.form.curr_id) {
            this.currencyDropDown.setSelection(state.form.curr_id);
        }
    }

    renderDateRangeFilter(state, prevState) {
        if (
            state.filter === prevState?.filter
            && state.form === prevState?.form
            && state.form.group === prevState?.form?.group
            && state.form.startDate === prevState?.form?.startDate
            && state.form.endDate === prevState?.form?.endDate
        ) {
            return;
        }

        this.dateRangeFilter.setState((rangeState) => ({
            ...rangeState,
            form: {
                ...rangeState.form,
                startDate: state.form.startDate,
                endDate: state.form.endDate,
            },
            filter: {
                ...rangeState.filter,
                startDate: dateStringToTime(state.form.startDate),
                endDate: dateStringToTime(state.form.endDate),
            },
        }));

        const { group } = state.form;
        const showRangeSelectors = (group === 'day' || group === 'week');
        const dateFilterURL = this.getURL(state);
        const weekRange = getWeekRange();
        dateFilterURL.searchParams.set('startDate', weekRange.startDate);
        dateFilterURL.searchParams.set('endDate', weekRange.endDate);
        this.weekRangeBtn.show(showRangeSelectors);
        this.weekRangeBtn.setURL(dateFilterURL.toString());

        const monthRange = getMonthRange();
        dateFilterURL.searchParams.set('startDate', monthRange.startDate);
        this.monthRangeBtn.show(showRangeSelectors);
        this.monthRangeBtn.setURL(dateFilterURL.toString());

        const halfYearRange = getHalfYearRange();
        dateFilterURL.searchParams.set('startDate', halfYearRange.startDate);
        this.halfYearRangeBtn.show(showRangeSelectors);
        this.halfYearRangeBtn.setURL(dateFilterURL.toString());
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderTypeFilter(state, prevState);
        this.renderReportTypeFilter(state, prevState);
        this.renderGroupTypeFilter(state, prevState);
        this.renderAccountsFilter(state, prevState);
        this.renderCurrencyFilter(state, prevState);
        this.renderCategoriesFilter(state, prevState);
        this.renderDateRangeFilter(state, prevState);
    }
}
