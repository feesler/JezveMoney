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
import { copyFields, dateToSeconds, shiftMonth } from '../common.js';
import {
    getColumnsInGroupCount,
    getDataSets,
    getLongestDataSet,
    getValidValuesCount,
    padArray,
} from '../model/histogram.js';

const GROUP_BY_DAY = 1;
const GROUP_BY_WEEK = 2;
const GROUP_BY_MONTH = 3;
const GROUP_BY_YEAR = 4;

const columnWidth = 38;
const columnGap = 10;
const groupsGap = 10;
const columnOuterWidth = columnWidth + columnGap;
const visibilityOffset = 1;

const availGroupTypes = [GROUP_BY_DAY, GROUP_BY_WEEK, GROUP_BY_MONTH, GROUP_BY_YEAR];

/** Statistics view class */
export class StatisticsView extends AppView {
    get filtersBtn() {
        return this.content.filtersBtn;
    }

    get typeMenu() {
        return this.content.typeMenu;
    }

    get groupTypeMenu() {
        return this.content.groupTypeMenu;
    }

    get reportMenu() {
        return this.content.reportMenu;
    }

    get currencyDropDown() {
        return this.content.currencyDropDown;
    }

    get dateFilter() {
        return this.content.dateFilter;
    }

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
            res.chart.width,
            res.chart.scrollerWidth,
            res.chart.scrollLeft,
            res.chart.animation,
            res.chart.heights,
        ] = await evaluate((titleEl, chartEl, ...barElems) => {
            const filtersEl = document.querySelector('.filters-collapsible');
            const accountsFilter = document.querySelector('#accountsFilter');
            const categoriesFilter = document.querySelector('#categoriesFilter');
            const currencyFilter = document.querySelector('#currencyFilter');
            const chartHorEl = chartEl.querySelector('.chart__horizontal');
            const chartScrollerEl = chartEl.querySelector('.chart__scroller');

            return [
                titleEl?.textContent ?? null,
                filtersEl?.classList?.contains('collapsible_animated') ?? false,
                accountsFilter && !accountsFilter.hidden,
                categoriesFilter && !categoriesFilter.hidden,
                currencyFilter && !currencyFilter.hidden,
                chartEl.dataset.time,
                chartEl.offsetWidth ?? 0,
                chartScrollerEl?.offsetWidth ?? 0,
                chartScrollerEl?.scrollLeft ?? 0,
                chartHorEl?.classList?.contains('chart_animated'),
                barElems.map((el) => el?.attributes?.height?.nodeValue),
            ];
        }, res.titleEl, res.chart.elem, ...bars);

        if (res.accountsFilterVisible) {
            const dropDownEl = await query('#accountsFilter .dd__container');
            res.accountsDropDown = await DropDown.create(this, dropDownEl);
        }

        if (res.categoriesFilterVisible) {
            const dropDownEl = await query('#categoriesFilter .dd__container');
            res.categoryDropDown = await DropDown.create(this, dropDownEl);
        }

        if (res.currencyFilterVisible) {
            const dropDownEl = await query('#currencyFilter .dd__container');
            res.currencyDropDown = await DropDown.create(this, dropDownEl);
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
            width: cont.chart.width,
            scrollerWidth: cont.chart.scrollerWidth,
            scrollLeft: cont.chart.scrollLeft,
            animation: cont.chart.animation,
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

    assignChartDimensions(expected, model = this.model) {
        const propsToCopy = ['width', 'scrollerWidth', 'scrollLeft'];
        const res = expected;

        if (!res.chart) {
            res.chart = {};
        }

        Object.assign(res.chart, copyFields(model.chart, propsToCopy));

        return res;
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
        const isStacked = (
            report === 'category'
            || (report === 'account' && model.filter.accounts?.length > 1)
        );

        const dataSets = getDataSets(histogram);
        const columnsInGroup = (isStacked) ? getColumnsInGroupCount(dataSets) : dataSets.length;
        const groupWidth = columnOuterWidth * columnsInGroup - columnGap;
        const groupOuterWidth = groupWidth + groupsGap;
        const longestSet = getLongestDataSet(dataSets);
        const expectedYAxisLabels = (longestSet.length > 0) ? 100 : 0;
        const availableWidth = (model.chart.scrollerWidth === 0)
            ? (model.chart.width - expectedYAxisLabels)
            : model.chart.scrollerWidth;

        const groupsVisible = Math.round(availableWidth / groupOuterWidth) + visibilityOffset;
        const groupsCount = Math.max(0, Math.min(longestSet.length, groupsVisible));
        let barsCount = 0;

        if (!noData) {
            if (isObject(firstValue)) {
                histogram.values.forEach((value) => {
                    if (value?.data?.length) {
                        const padded = padArray(value.data, longestSet.length);
                        const visibleItems = padded.slice(longestSet.length - groupsCount);
                        barsCount += getValidValuesCount(visibleItems);
                    }
                });
            } else {
                barsCount = getValidValuesCount(histogram.values.slice(-groupsCount));
            }
        }

        res.chart = {
            bars: { length: barsCount },
        };
        res.noDataMessage.visible = noData;
        res.chartContainer.visible = !noData;

        return res;
    }

    async runFiltersAction(action) {
        await this.parse();
        await this.openFilters();
        await this.waitForData(action);
        await this.closeFilters();
    }

    checkFixedState(model) {
        App.view.assignChartDimensions(model);
        const expected = App.view.getExpectedState(model);
        return App.view.checkState(expected);
    }

    async waitForLoad() {
        await waitForFunction(async () => {
            await this.parse();
            return (
                !this.model.chart.animation
                && !this.model.loading
            );
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
                && !this.model.chart.animation
                && prevTime !== this.model.renderTime
            );
        });

        await this.parse();
    }

    async waitForAnimation(action, model) {
        const expectedVisibility = model.filtersVisible;

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

        const model = this.cloneModel();
        model.filtersVisible = true;
        const expected = this.getExpectedState(model);

        await this.waitForAnimation(() => this.filtersBtn.click(), model);

        return this.checkState(expected);
    }

    async closeFilters() {
        if (!this.model.filtersVisible) {
            return true;
        }

        const model = this.cloneModel();
        model.filtersVisible = false;
        const expected = this.getExpectedState(model);

        const { closeFiltersBtn } = this.content;
        if (closeFiltersBtn.visible) {
            await this.waitForAnimation(() => click(closeFiltersBtn.elem), model);
        } else {
            await this.waitForAnimation(() => this.filtersBtn.click(), model);
        }

        return this.checkState(expected);
    }

    async filterByType(value) {
        const types = asArray(value).sort();

        if (this.typeMenu.isSameSelected(types)) {
            return true;
        }

        const model = this.cloneModel();
        const typesBefore = model.filter.type;
        model.filter.type = types;

        await this.runFiltersAction(async () => {
            // Select new types
            for (const type of Transaction.availTypes) {
                if (!typesBefore.includes(type) && types.includes(type)) {
                    await this.performAction(() => App.view.typeMenu.toggle(type));
                }
            }
            // Deselect previous types
            for (const type of Transaction.availTypes) {
                if (typesBefore.includes(type) && !types.includes(type)) {
                    await this.performAction(() => App.view.typeMenu.toggle(type));
                }
            }
        });

        return App.view.checkFixedState(model);
    }

    async byCategories() {
        const model = this.cloneModel();
        model.filter.report = 'category';
        delete model.filter.curr_id;
        delete model.filter.accounts;
        model.filter.categories = [];

        await this.runFiltersAction(() => this.reportMenu.selectItemByValue('category'));

        return App.view.checkFixedState(model);
    }

    async byAccounts() {
        const model = this.cloneModel();
        model.filter.report = 'account';
        model.filter.accounts = [];
        delete model.filter.curr_id;
        delete model.filter.categories;

        await this.runFiltersAction(() => this.reportMenu.selectItemByValue('account'));

        return App.view.checkFixedState(model);
    }

    async byCurrencies() {
        const model = this.cloneModel();
        model.filter.report = 'currency';
        delete model.filter.accounts;
        delete model.filter.categories;

        const currency = App.currency.getItemByIndex(0);
        model.filter.curr_id = currency.id;

        await this.runFiltersAction(() => this.reportMenu.selectItemByValue('currency'));

        return App.view.checkFixedState(model);
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
        const model = this.cloneModel();
        const categories = asArray(ids);
        model.filter.categories = categories;

        await this.runFiltersAction(() => (
            this.setFilterSelection('categoryDropDown', categories)
        ));

        return App.view.checkFixedState(model);
    }

    async filterByAccounts(ids) {
        assert(App.state.accounts.length > 0, 'No accounts available');

        const model = this.cloneModel();
        const accounts = asArray(ids);
        model.filter.accounts = accounts;

        await this.runFiltersAction(() => (
            this.setFilterSelection('accountsDropDown', accounts)
        ));

        return App.view.checkFixedState(model);
    }

    async selectCurrency(currencyId) {
        assert(this.currencyDropDown, 'Currency drop down control not found');

        const model = this.cloneModel();
        model.filter.curr_id = parseInt(currencyId, 10);

        await this.runFiltersAction(() => this.currencyDropDown.setSelection(currencyId));

        return App.view.checkFixedState(model);
    }

    async groupBy(group) {
        const groupName = this.getGroupTypeName(group);

        const model = this.cloneModel();
        model.filter.group = group;

        await this.runFiltersAction(() => this.groupTypeMenu.selectItemByValue(groupName));

        return App.view.checkFixedState(model);
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

        const { filter } = this.model;
        const startDate = dateToSeconds(App.dates.weekAgo);
        const endDate = dateToSeconds(App.dates.now);
        if (filter.startDate === startDate && filter.endDate === endDate) {
            return true;
        }

        const model = this.cloneModel();
        model.filter.startDate = startDate;
        model.filter.endDate = endDate;

        await this.runFiltersAction(() => {
            assert(this.content.weekRangeBtn.visible, 'Week range button not visible');
            return click(this.content.weekRangeBtn.elem);
        });

        return this.checkFixedState(model);
    }

    async selectMonthRangeFilter() {
        this.checkRangeSelectorsAvailable();

        const { filter } = this.model;
        const startDate = dateToSeconds(App.dates.monthAgo);
        const endDate = dateToSeconds(App.dates.now);
        if (filter.startDate === startDate && filter.endDate === endDate) {
            return true;
        }

        const model = this.cloneModel();
        model.filter.startDate = startDate;
        model.filter.endDate = endDate;

        await this.runFiltersAction(() => {
            assert(this.content.monthRangeBtn.visible, 'Month range button not visible');
            return click(this.content.monthRangeBtn.elem);
        });

        return this.checkFixedState(model);
    }

    async selectHalfYearRangeFilter() {
        this.checkRangeSelectorsAvailable();

        const { filter } = this.model;
        const startDate = dateToSeconds(shiftMonth(App.dates.now, -6));
        const endDate = dateToSeconds(App.dates.now);
        if (filter.startDate === startDate && filter.endDate === endDate) {
            return true;
        }

        const model = this.cloneModel();
        model.filter.startDate = startDate;
        model.filter.endDate = endDate;

        await this.runFiltersAction(() => {
            assert(this.content.halfYearRangeBtn.visible, 'Half a year range button not visible');
            return click(this.content.halfYearRangeBtn.elem);
        });

        return this.checkFixedState(model);
    }

    async selectStartDateFilter(value) {
        const date = new Date(App.parseDate(value));
        const startDate = dateToSeconds(date);
        if (this.model.filter.startDate === startDate) {
            return true;
        }

        const model = this.cloneModel();
        model.filter.startDate = startDate;

        await this.runFiltersAction(() => this.dateFilter.selectStart(date));

        return App.view.checkFixedState(model);
    }

    async selectEndDateFilter(value) {
        const date = new Date(App.parseDate(value));
        const endDate = dateToSeconds(date);
        if (this.model.filter.endDate === endDate) {
            return true;
        }

        const model = this.cloneModel();
        model.filter.endDate = endDate;

        await this.runFiltersAction(() => this.dateFilter.selectEnd(date));

        return App.view.checkFixedState(model);
    }

    async clearStartDateFilter() {
        const model = this.cloneModel();
        model.filter.startDate = null;

        await this.runFiltersAction(() => this.dateFilter.clearStart());

        return App.view.checkFixedState(model);
    }

    async clearEndDateFilter() {
        const model = this.cloneModel();
        model.filter.endDate = null;

        await this.runFiltersAction(() => this.dateFilter.clearEnd());

        return this.checkFixedState(model);
    }
}
