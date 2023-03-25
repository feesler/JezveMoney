import {
    assert,
    asArray,
    query,
    queryAll,
    prop,
    click,
    isVisible,
    waitForFunction,
    isObject,
} from 'jezve-test';
import { DropDown, LinkMenu, Button } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { availTransTypes } from '../model/Transaction.js';
import { DatePickerFilter } from './component/DatePickerFilter.js';
import { TransactionTypeMenu } from './component/LinkMenu/TransactionTypeMenu.js';
import { App } from '../Application.js';
import { dateToSeconds, fixDate, secondsToDateString } from '../common.js';

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
            closeFiltersBtn: { elem: await query('#closeFiltersBtn') },
            typeMenu: await TransactionTypeMenu.create(this, await query('.trtype-menu')),
            reportMenu: await LinkMenu.create(this, await query('#reportMenu')),
        };

        assert(res.titleEl, 'Wrong statistics view structure');

        res.title = await prop(res.titleEl, 'textContent');

        res.accountsDropDown = null;
        const accountsFilter = await query('#accountsFilter');
        if (await isVisible(accountsFilter)) {
            res.accountsDropDown = await DropDown.createFromChild(this, await query('#acc_id'));
        }

        res.categoryDropDown = null;
        const categoriesFilter = await query('#categoriesFilter');
        if (await isVisible(categoriesFilter)) {
            res.categoryDropDown = await DropDown.createFromChild(this, await query('#category_id'));
        }

        res.currencyDropDown = null;
        const currencyFilter = await query('#currencyFilter');
        if (await isVisible(currencyFilter)) {
            res.currencyDropDown = await DropDown.createFromChild(this, await query('#curr_id'));
        }

        res.groupDropDown = await DropDown.createFromChild(this, await query('#groupsel'));

        res.dateFilter = await DatePickerFilter.create(this, await query('#dateFilter'));
        assert(res.dateFilter, 'Date filter not found');

        res.chart = {
            elem: await query('.histogram'),
            bars: [],
        };
        assert(res.chart, 'Invalid statistics view structure');

        res.chart.renderTime = await prop(res.chart.elem, 'dataset.time');
        res.chartContainer = { elem: await query(res.chart.elem, '.chart__horizontal') };

        res.loadingIndicator = { elem: await query('.stat-histogram .loading-indicator') };
        res.noDataMessage = { elem: await query('.stat-histogram .nodata-message') };

        const bars = await queryAll(res.chart.elem, '.histogram__bar');
        for (const bar of bars) {
            res.chart.bars.push({
                elem: bar,
                height: await prop(bar, 'attributes.height.nodeValue'),
            });
        }

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
        };

        res.filter = {
            type: cont.typeMenu.value,
            report: cont.reportMenu.value,
            startDate: null,
            endDate: null,
        };
        const dateRange = cont.dateFilter.getSelectedRange();
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            const startDate = new Date(fixDate(dateRange.startDate));
            const endDate = new Date(fixDate(dateRange.endDate));

            res.filter.startDate = dateToSeconds(startDate);
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

        const [selectedGroup] = cont.groupDropDown.getSelectedValues();
        const groupType = parseInt(selectedGroup, 10);
        assert(!Number.isNaN(groupType) && availGroupTypes.includes(groupType), 'Invalid group type');
        res.filter.group = groupType;

        res.chart = {
            bars: cont.chart.bars.map(({ height }) => ({ height })),
        };

        res.renderTime = cont.chart.renderTime;
        res.loading = cont.loadingIndicator.visible;

        return res;
    }

    getGroupTypeString(groupType) {
        const groupTypesMap = {
            [GROUP_BY_DAY]: 'day',
            [GROUP_BY_WEEK]: 'week',
            [GROUP_BY_MONTH]: 'month',
            [GROUP_BY_YEAR]: 'year',
        };

        assert(groupType in groupTypesMap, 'Invalid group type');

        return groupTypesMap[groupType];
    }

    getExpectedState(model = this.model) {
        const { filtersVisible } = model;
        const { report } = model.filter;

        const res = {
            typeMenu: {
                visible: filtersVisible,
                value: model.filter.type,
            },
            reportMenu: {
                visible: filtersVisible,
                value: report,
            },
            dateFilter: {
                visible: filtersVisible,
                value: {
                    startDate: (model.filter.startDate)
                        ? secondsToDateString(model.filter.startDate)
                        : null,
                    endDate: (model.filter.endDate)
                        ? secondsToDateString(model.filter.endDate)
                        : null,
                },
            },
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
            group: this.getGroupTypeString(model.filter.group),
        };
        if (report === 'currency') {
            params.curr_id = model.filter.curr_id;
        } else if (report === 'account') {
            params.acc_id = model.filter.accounts;
        } else if (report === 'category') {
            params.category_id = model.filter.categories;
        }

        if (model.filter.startDate && model.filter.endDate) {
            params.startDate = model.filter.startDate;
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

    async openFilters() {
        if (this.model.filtersVisible) {
            return true;
        }

        this.model.filtersVisible = true;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.filtersBtn.click());

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
            await this.performAction(() => click(closeFiltersBtn.elem));
        } else {
            await this.performAction(() => this.content.filtersBtn.click());
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

        if (types.length === 1) {
            const [type] = types;
            await this.waitForData(() => App.view.content.typeMenu.select(type));
        } else {
            // Select new types
            for (const type of availTransTypes) {
                if (!typesBefore.includes(type) && types.includes(type)) {
                    await this.waitForData(() => App.view.content.typeMenu.toggle(type));
                }
            }
            // Deselect previous types
            for (const type of availTransTypes) {
                if (typesBefore.includes(type) && !types.includes(type)) {
                    await this.waitForData(() => App.view.content.typeMenu.toggle(type));
                }
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

        this.model.filter.group = group;
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.groupDropDown.setSelection(group));

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

    async selectDateRange(start, end) {
        await this.openFilters();

        const startDate = new Date(fixDate(start));
        const endDate = new Date(fixDate(end));

        this.model.filter.startDate = dateToSeconds(startDate);
        this.model.filter.endDate = dateToSeconds(endDate);
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.dateFilter.selectRange(startDate, endDate));

        return App.view.checkState(expected);
    }

    async clearDateRange() {
        await this.openFilters();

        this.model.filter.startDate = null;
        this.model.filter.endDate = null;
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.dateFilter.clear());

        return App.view.checkState(expected);
    }
}
