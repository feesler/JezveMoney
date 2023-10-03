import {
    assert,
    asArray,
    query,
    queryAll,
    click,
    waitForFunction,
    isObject,
    evaluate,
} from 'jezve-test';
import { DropDown, LinkMenu, Button } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { Transaction } from '../model/Transaction.js';
import { DatePickerFilter } from './component/Fields/DatePickerFilter.js';
import { TransactionTypeMenu } from './component/Fields/TransactionTypeMenu.js';
import { App } from '../Application.js';
import { dateToSeconds, shiftMonth } from '../common.js';

const GROUP_BY_DAY = 1;
const GROUP_BY_WEEK = 2;
const GROUP_BY_MONTH = 3;
const GROUP_BY_YEAR = 4;

const availGroupTypes = [GROUP_BY_DAY, GROUP_BY_WEEK, GROUP_BY_MONTH, GROUP_BY_YEAR];

/** Statistics view class */
export class StatisticsView extends AppView {
    async parseContent() {
        const res = {
            titleEl: await query('.content_wrap > .heading > h1'),
            filtersBtn: await Button.create(this, await query('#filtersBtn')),
            filtersContainer: { elem: await query('#filtersContainer') },
            closeFiltersBtn: { elem: await query('.filters-offcanvas .close-btn') },
            typeMenu: await TransactionTypeMenu.create(this, await query('.trtype-menu')),
            reportMenu: await LinkMenu.create(this, await query('#reportMenu')),
            accountsDropDown: null,
            categoryDropDown: null,
            currencyDropDown: null,
            chart: {
                elem: await query('.histogram'),
                bars: [],
            },
        };

        assert(res.chart.elem, 'Invalid statistics view structure');
        assert(res.titleEl, 'Wrong statistics view structure');

        const bars = await queryAll(res.chart.elem, '.histogram__bar');

        [
            res.title,
            res.filtersAnimation,
            res.accountsFilterVisible,
            res.categoriesFilterVisible,
            res.currencyFilterVisible,
            res.chart.renderTime,
            res.chart.heights,
        ] = await evaluate((titleEl, chartEl, ...barElems) => {
            const filtersEl = document.querySelector('.filters-collapsible');
            const accountsFilter = document.querySelector('#accountsFilter');
            const categoriesFilter = document.querySelector('#categoriesFilter');
            const currencyFilter = document.querySelector('#currencyFilter');

            return [
                titleEl?.textContent ?? null,
                filtersEl?.classList?.contains('collapsible_animated') ?? false,
                accountsFilter && !accountsFilter.hidden,
                categoriesFilter && !categoriesFilter.hidden,
                currencyFilter && !currencyFilter.hidden,
                chartEl.dataset.time,
                barElems.map((el) => el?.attributes?.height?.nodeValue),
            ];
        }, res.titleEl, res.chart.elem, ...bars);

        if (res.accountsFilterVisible) {
            res.accountsDropDown = await DropDown.createFromChild(this, await query('#acc_id'));
        }

        if (res.categoriesFilterVisible) {
            res.categoryDropDown = await DropDown.createFromChild(this, await query('#category_id'));
        }

        if (res.currencyFilterVisible) {
            res.currencyDropDown = await DropDown.createFromChild(this, await query('#curr_id'));
        }

        res.groupTypeMenu = await LinkMenu.create(this, await query('#groupTypeMenu'));

        res.dateFilter = await DatePickerFilter.create(this, await query('#dateFilter'));
        assert(res.dateFilter, 'Date filter not found');

        res.weekRangeBtn = { elem: await query('.field-header-btn[data-value="week"]') };
        res.monthRangeBtn = { elem: await query('.field-header-btn[data-value="month"]') };
        res.halfYearRangeBtn = { elem: await query('.field-header-btn[data-value="halfyear"]') };

        res.chartContainer = { elem: await query(res.chart.elem, '.chart__horizontal') };

        res.loadingIndicator = { elem: await query('.stat-histogram .loading-indicator') };
        res.noDataMessage = { elem: await query('.stat-histogram .nodata-message') };

        res.chart.bars = bars.map((elem, index) => ({
            elem,
            height: res.chart.heights[index],
        }));

        return res;
    }

    getDropDownFilter(dropDown) {
        return (dropDown)
            ? dropDown.getSelectedValues().map((item) => parseInt(item, 10))
            : [];
    }

    buildModel(cont) {
        const res = {
            locale: cont.locale,
            filtersVisible: cont.filtersContainer.visible,
            filtersAnimation: !!cont.filtersAnimation,
        };

        res.filter = {
            type: cont.typeMenu.value,
            report: cont.reportMenu.value,
            startDate: null,
            endDate: null,
        };

        const dateRange = cont.dateFilter.getSelectedRange();
        if (dateRange?.startDate) {
            const startDate = new Date(App.parseDate(dateRange.startDate));
            res.filter.startDate = dateToSeconds(startDate);
        }
        if (dateRange?.endDate) {
            const endDate = new Date(App.parseDate(dateRange.endDate));
            res.filter.endDate = dateToSeconds(endDate);
        }

        if (res.filter.report === 'currency') {
            const [selectedCurr] = cont.currencyDropDown.getSelectedValues();
            const currency = App.currency.getItem(selectedCurr);
            assert(currency, 'Currency not found');

            res.filter.curr_id = currency.id;
        } else if (res.filter.report === 'account') {
            res.filter.accounts = this.getDropDownFilter(cont.accountsDropDown);
        } else if (res.filter.report === 'category') {
            res.filter.categories = this.getDropDownFilter(cont.categoryDropDown);
        }

        const selectedGroup = cont.groupTypeMenu.value;
        const groupType = this.getGroupTypeByName(selectedGroup);
        assert(availGroupTypes.includes(groupType), 'Invalid group type');
        res.filter.group = groupType;

        res.chart = {
            bars: cont.chart.bars.map(({ height }) => ({ height })),
        };

        res.renderTime = cont.chart.renderTime;
        res.loading = cont.loadingIndicator.visible;

        return res;
    }

    getGroupTypeName(groupType) {
        const groupTypesMap = {
            [GROUP_BY_DAY]: 'day',
            [GROUP_BY_WEEK]: 'week',
            [GROUP_BY_MONTH]: 'month',
            [GROUP_BY_YEAR]: 'year',
        };

        assert(groupType in groupTypesMap, 'Invalid group type');

        return groupTypesMap[groupType];
    }

    getGroupTypeByName(groupName) {
        const groupTypesMap = {
            day: GROUP_BY_DAY,
            week: GROUP_BY_WEEK,
            month: GROUP_BY_MONTH,
            year: GROUP_BY_YEAR,
        };

        assert(groupName in groupTypesMap, 'Invalid group type');

        return groupTypesMap[groupName];
    }

    getExpectedState(model = this.model, state = App.state) {
        const { filtersVisible } = model;
        const {
            report,
            group,
            startDate,
            endDate,
        } = model.filter;
        const showRangeSelectors = (group === GROUP_BY_DAY || group === GROUP_BY_WEEK);

        let startDateFmt = '';
        if (startDate) {
            const dateFmt = App.secondsToDateString(startDate);
            startDateFmt = App.reformatDate(dateFmt);
        }

        let endDateFmt = '';
        if (endDate) {
            const dateFmt = App.secondsToDateString(endDate);
            endDateFmt = App.reformatDate(dateFmt);
        }

        const res = {
            header: this.getHeaderExpectedState(state),
            typeMenu: {
                visible: filtersVisible,
                value: model.filter.type,
            },
            reportMenu: {
                visible: filtersVisible,
                value: report,
            },
            groupTypeMenu: {
                visible: filtersVisible,
                value: this.getGroupTypeName(group),
            },
            dateFilter: {
                visible: filtersVisible,
                value: {
                    startDate: startDateFmt,
                    endDate: endDateFmt,
                },
            },
            weekRangeBtn: { visible: filtersVisible && showRangeSelectors },
            monthRangeBtn: { visible: filtersVisible && showRangeSelectors },
            halfYearRangeBtn: { visible: filtersVisible && showRangeSelectors },
            noDataMessage: {},
            chartContainer: {},
        };

        if (report === 'currency') {
            const currency = App.currency.getItem(model.filter.curr_id);
            res.currencyDropDown = {
                visible: filtersVisible,
                textValue: currency.formatName(this.locale),
            };
        } else if (report === 'account') {
            res.accountsDropDown = {
                visible: filtersVisible,
                isMulti: true,
                selectedItems: model.filter.accounts.map((id) => ({ id: id.toString() })),
            };
        } else if (report === 'category') {
            res.categoryDropDown = {
                visible: filtersVisible,
                isMulti: true,
                selectedItems: model.filter.categories.map((id) => ({ id: id.toString() })),
            };
        }

        // Prepare expected histogram data
        const params = {
            type: model.filter.type,
            report,
            group: this.getGroupTypeName(model.filter.group),
        };
        if (report === 'currency') {
            params.curr_id = model.filter.curr_id;
        } else if (report === 'account') {
            params.accounts = model.filter.accounts;
        } else if (report === 'category') {
            params.categories = model.filter.categories;
        }

        if (model.filter.startDate) {
            params.startDate = model.filter.startDate;
        }
        if (model.filter.endDate) {
            params.endDate = model.filter.endDate;
        }

        const histogram = App.state.transactions.getStatistics(params);
        const [firstValue] = histogram.values ?? [];
        const dataSet = firstValue?.data ?? [];
        const noData = !dataSet.length && !histogram.series?.length;

        let barsCount = 0;
        const getValidValuesCount = (values) => values.reduce((count, value) => (
            (value === 0) ? count : (count + 1)
        ), 0);

        if (!noData) {
            if (isObject(firstValue)) {
                histogram.values.forEach((value) => {
                    if (value?.data?.length) {
                        barsCount += getValidValuesCount(value.data);
                    }
                });
            } else {
                barsCount = getValidValuesCount(histogram.values);
            }
        }

        res.chart = {
            bars: { length: barsCount },
        };
        res.noDataMessage.visible = noData;
        res.chartContainer.visible = !noData;

        return res;
    }

    async waitForLoad() {
        await waitForFunction(async () => {
            await this.parse();
            return !this.model.loading;
        });

        await this.parse();
    }

    async waitForData(action) {
        await this.parse();

        const prevTime = this.model.renderTime;

        await action();

        await waitForFunction(async () => {
            await this.parse();
            return (
                !this.model.loading
                && prevTime !== this.model.renderTime
            );
        });

        await this.parse();
    }

    async waitForAnimation(action) {
        const expectedVisibility = this.model.filtersVisible;

        await this.parse();

        await action();

        await waitForFunction(async () => {
            await this.parse();
            return (
                !this.model.filtersAnimation
                && this.model.filtersVisible === expectedVisibility
            );
        });

        await this.parse();
    }

    async openFilters() {
        if (this.model.filtersVisible) {
            return true;
        }

        this.model.filtersVisible = true;
        const expected = this.getExpectedState();

        await this.waitForAnimation(() => this.content.filtersBtn.click());

        return this.checkState(expected);
    }

    async closeFilters() {
        if (!this.model.filtersVisible) {
            return true;
        }

        this.model.filtersVisible = false;
        const expected = this.getExpectedState();

        const { closeFiltersBtn } = this.content;
        if (closeFiltersBtn.visible) {
            await this.waitForAnimation(() => click(closeFiltersBtn.elem));
        } else {
            await this.waitForAnimation(() => this.content.filtersBtn.click());
        }

        return this.checkState(expected);
    }

    async filterByType(value) {
        const types = asArray(value);
        types.sort();

        if (this.content.typeMenu.isSameSelected(types)) {
            return true;
        }

        await this.openFilters();

        const typesBefore = this.model.filter.type;
        this.model.filter.type = types;
        const expected = this.getExpectedState();

        // Select new types
        for (const type of Transaction.availTypes) {
            if (!typesBefore.includes(type) && types.includes(type)) {
                await this.waitForData(() => App.view.content.typeMenu.toggle(type));
            }
        }
        // Deselect previous types
        for (const type of Transaction.availTypes) {
            if (typesBefore.includes(type) && !types.includes(type)) {
                await this.waitForData(() => App.view.content.typeMenu.toggle(type));
            }
        }

        return App.view.checkState(expected);
    }

    async byCategories() {
        await this.parse();

        await this.openFilters();

        this.model.filter.report = 'category';
        delete this.model.filter.curr_id;
        delete this.model.filter.accounts;
        this.model.filter.categories = [];
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.reportMenu.selectItemByValue('category'));

        return App.view.checkState(expected);
    }

    async byAccounts() {
        await this.parse();

        await this.openFilters();

        this.model.filter.report = 'account';
        this.model.filter.accounts = [];
        delete this.model.filter.curr_id;
        delete this.model.filter.categories;
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.reportMenu.selectItemByValue('account'));

        return App.view.checkState(expected);
    }

    async byCurrencies() {
        await this.parse();

        await this.openFilters();

        this.model.filter.report = 'currency';
        delete this.model.filter.accounts;
        delete this.model.filter.categories;

        const currency = App.currency.getItemByIndex(0);
        this.model.filter.curr_id = currency.id;
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.reportMenu.selectItemByValue('currency'));

        return App.view.checkState(expected);
    }

    async setFilterSelection(dropDown, itemIds) {
        const ids = asArray(itemIds);
        const selection = this.content[dropDown].getSelectedValues();
        if (selection.length > 0) {
            await this.waitForData(() => this.content[dropDown].clearSelection());
        }
        if (ids.length === 0) {
            return;
        }

        for (const id of ids) {
            await this.waitForData(() => this.content[dropDown].selectItem(id));
        }

        await this.performAction(() => this.content[dropDown].showList(false));
    }

    async filterByCategories(ids) {
        await this.openFilters();

        const categories = asArray(ids);
        this.model.filter.categories = categories;
        const expected = this.getExpectedState();

        await this.setFilterSelection('categoryDropDown', categories);

        return App.view.checkState(expected);
    }

    async filterByAccounts(ids) {
        assert(App.state.accounts.length > 0, 'No accounts available');

        await this.openFilters();

        const accounts = asArray(ids);
        this.model.filter.accounts = accounts;
        const expected = this.getExpectedState();

        await this.setFilterSelection('accountsDropDown', accounts);

        return App.view.checkState(expected);
    }

    async selectCurrency(currencyId) {
        assert(this.content.currencyDropDown, 'Currency drop down control not found');

        await this.openFilters();

        this.model.filter.curr_id = parseInt(currencyId, 10);
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.currencyDropDown.setSelection(currencyId));

        return App.view.checkState(expected);
    }

    selectCurrencyByPos(pos) {
        assert(this.content.currencyDropDown, 'Currency drop down control not found');

        return this.selectCurrency(this.content.currencyDropDown.content.items[pos].id);
    }

    async groupBy(group) {
        await this.openFilters();

        const groupName = this.getGroupTypeName(group);

        this.model.filter.group = group;
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.groupTypeMenu.selectItemByValue(groupName));

        return App.view.checkState(expected);
    }

    groupByDay() {
        return this.groupBy(GROUP_BY_DAY);
    }

    groupByWeek() {
        return this.groupBy(GROUP_BY_WEEK);
    }

    groupByMonth() {
        return this.groupBy(GROUP_BY_MONTH);
    }

    groupByYear() {
        return this.groupBy(GROUP_BY_YEAR);
    }

    checkRangeSelectorsAvailable() {
        const { group } = this.model.filter;
        assert(group === GROUP_BY_DAY || group === GROUP_BY_WEEK, `Invalid group type: ${group}`);
    }

    async selectWeekRangeFilter() {
        this.checkRangeSelectorsAvailable();

        await this.openFilters();

        const { filter } = this.model;
        const startDate = dateToSeconds(App.dates.weekAgo);
        const endDate = dateToSeconds(App.dates.now);
        if (filter.startDate === startDate && filter.endDate === endDate) {
            return true;
        }

        filter.startDate = startDate;
        filter.endDate = endDate;
        const expected = this.getExpectedState();

        assert(this.content.weekRangeBtn.visible, 'Week range button not visible');
        await this.waitForData(() => click(this.content.weekRangeBtn.elem));

        return this.checkState(expected);
    }

    async selectMonthRangeFilter() {
        this.checkRangeSelectorsAvailable();

        await this.openFilters();

        const { filter } = this.model;
        const startDate = dateToSeconds(App.dates.monthAgo);
        const endDate = dateToSeconds(App.dates.now);
        if (filter.startDate === startDate && filter.endDate === endDate) {
            return true;
        }

        filter.startDate = startDate;
        filter.endDate = endDate;
        const expected = this.getExpectedState();

        assert(this.content.monthRangeBtn.visible, 'Month range button not visible');
        await this.waitForData(() => click(this.content.monthRangeBtn.elem));

        return this.checkState(expected);
    }

    async selectHalfYearRangeFilter() {
        this.checkRangeSelectorsAvailable();

        await this.openFilters();

        const { filter } = this.model;
        const startDate = dateToSeconds(shiftMonth(App.dates.now, -6));
        const endDate = dateToSeconds(App.dates.now);
        if (filter.startDate === startDate && filter.endDate === endDate) {
            return true;
        }

        filter.startDate = startDate;
        filter.endDate = endDate;
        const expected = this.getExpectedState();

        assert(this.content.halfYearRangeBtn.visible, 'Half a year range button not visible');
        await this.waitForData(() => click(this.content.halfYearRangeBtn.elem));

        return this.checkState(expected);
    }

    async selectStartDateFilter(value) {
        await this.openFilters();

        const date = new Date(App.parseDate(value));
        const startDate = dateToSeconds(date);
        if (this.model.filter.startDate === startDate) {
            return true;
        }

        this.model.filter.startDate = startDate;
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.dateFilter.selectStart(date));

        return App.view.checkState(expected);
    }

    async selectEndDateFilter(value) {
        await this.openFilters();

        const date = new Date(App.parseDate(value));
        const endDate = dateToSeconds(date);
        if (this.model.filter.endDate === endDate) {
            return true;
        }

        this.model.filter.endDate = endDate;
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.dateFilter.selectEnd(date));

        return App.view.checkState(expected);
    }

    async clearStartDateFilter() {
        await this.openFilters();

        this.model.filter.startDate = null;
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.dateFilter.clearStart());

        return App.view.checkState(expected);
    }

    async clearEndDateFilter() {
        await this.openFilters();

        this.model.filter.endDate = null;
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.dateFilter.clearEnd());

        return App.view.checkState(expected);
    }
}
