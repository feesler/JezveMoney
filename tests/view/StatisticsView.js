import {
    assert,
    query,
    queryAll,
    prop,
    parentNode,
    isVisible,
    waitForFunction,
} from 'jezve-test';
import { DropDown } from 'jezvejs/tests';
import { AppView } from './AppView.js';
import { availTransTypes } from '../model/Transaction.js';
import { DatePickerFilter } from './component/DatePickerFilter.js';
import { TransactionTypeMenu } from './component/TransactionTypeMenu.js';
import { App } from '../Application.js';
import { fixDate } from '../common.js';

const NO_GROUP = 0;
const GROUP_BY_DAY = 1;
const GROUP_BY_WEEK = 2;
const GROUP_BY_MONTH = 3;
const GROUP_BY_YEAR = 4;

const availGroupTypes = [NO_GROUP, GROUP_BY_DAY, GROUP_BY_WEEK, GROUP_BY_MONTH, GROUP_BY_YEAR];

/** Statistics view class */
export class StatisticsView extends AppView {
    async parseContent() {
        const res = {
            titleEl: await query('.content_wrap > .heading > h1'),
        };

        assert(res.titleEl, 'Wrong statistics view structure');

        res.typeMenu = await TransactionTypeMenu.create(this, await query('.trtype-menu'));
        res.title = await prop(res.titleEl, 'textContent');

        res.filterByDropDown = await DropDown.createFromChild(this, await query('#filter_type'));

        res.accountsDropDown = null;
        const accountsFilter = await query('#acc_block');
        if (await isVisible(accountsFilter, true)) {
            res.accountsDropDown = await DropDown.createFromChild(this, await query('#acc_id'));
        }

        res.currencyDropDown = null;
        const currencyFilter = await query('#curr_block');
        if (await isVisible(currencyFilter)) {
            res.currencyDropDown = await DropDown.createFromChild(this, await query('#curr_id'));
        }

        res.groupDropDown = await DropDown.createFromChild(this, await query('#groupsel'));

        const calendarBtn = await query('#calendar_btn');
        res.dateFilter = await DatePickerFilter.create(this, await parentNode(calendarBtn));
        assert(res.dateFilter, 'Date filter not found');

        res.chart = {
            elem: await query('#chart'),
            bars: [],
        };
        assert(res.chart, 'Invalid statistics view structure');

        res.chart.renderTime = await prop(res.chart.elem, 'dataset.time');
        res.chartContainer = { elem: await query(res.chart.elem, '.charts') };

        res.loadingIndicator = { elem: await query('.loading-indicator') };
        res.noDataMessage = { elem: await query(res.chart.elem, '.nodata-message') };

        const bars = await queryAll(res.chart.elem, '.histogram__bar');
        for (const bar of bars) {
            res.chart.bars.push({
                elem: bar,
                height: await prop(bar, 'attributes.height.nodeValue'),
            });
        }

        return res;
    }

    async buildModel(cont) {
        const res = {};

        const selectedFilter = cont.filterByDropDown.content.textValue;
        res.filter = {
            type: cont.typeMenu.getSelectedTypes(),
            byCurrency: selectedFilter === 'Currencies',
        };
        const dateRange = cont.dateFilter.getSelectedRange();
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            res.filter.startDate = dateRange.startDate;
            res.filter.endDate = dateRange.endDate;
        }

        if (res.filter.byCurrency) {
            const [selectedCurr] = cont.currencyDropDown.getSelectedValues();
            const currency = App.currency.getItem(selectedCurr);
            assert(currency, 'Currency not found');

            res.filter.curr_id = currency.id;
        } else {
            const [selectedAccount] = cont.accountsDropDown.getSelectedValues();
            const account = App.state.accounts.getItem(selectedAccount);
            assert(account, 'Account not found');

            res.filter.acc_id = account.id;
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
            [NO_GROUP]: 'none',
            [GROUP_BY_DAY]: 'day',
            [GROUP_BY_WEEK]: 'week',
            [GROUP_BY_MONTH]: 'month',
            [GROUP_BY_YEAR]: 'year',
        };

        assert(groupType in groupTypesMap, 'Invalid group type');

        return groupTypesMap[groupType];
    }

    getExpectedState() {
        const { byCurrency } = this.model.filter;

        const res = {
            typeMenu: { selectedTypes: this.model.filter.type },
            filterByDropDown: {
                visible: true,
                textValue: (byCurrency) ? 'Currencies' : 'Accounts',
            },
            dateFilter: {},
            noDataMessage: {},
            chartContainer: {},
        };

        if (byCurrency) {
            const currency = App.currency.getItem(this.model.filter.curr_id);
            res.currencyDropDown = {
                visible: true,
                textValue: currency.name,
            };
        } else {
            const account = App.state.accounts.getItem(this.model.filter.acc_id);
            res.accountsDropDown = {
                visible: true,
                textValue: account.name,
            };
        }

        // Prepare expected histogram data
        const params = {
            type: this.model.filter.type,
            filter: (byCurrency) ? 'currency' : 'account',
            group: this.getGroupTypeString(this.model.filter.group),
        };
        if (byCurrency) {
            params.curr_id = this.model.filter.curr_id;
        } else {
            params.acc_id = this.model.filter.acc_id;
        }

        if (this.model.filter.startDate && this.model.filter.endDate) {
            params.startDate = this.model.filter.startDate;
            params.endDate = this.model.filter.endDate;

            res.dateFilter.value = { startDate: params.startDate, endDate: params.endDate };
        } else {
            res.dateFilter.value = { startDate: null, endDate: null };
        }

        const histogram = App.state.transactions.getStatistics(params);
        res.chart = {
            bars: { length: histogram.values.length },
        };
        res.noDataMessage.visible = histogram.values.length === 0;
        res.chartContainer.visible = histogram.values.length > 0;

        return res;
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
    }

    async filterByType(type) {
        const newTypeSel = Array.isArray(type) ? type : [type];
        newTypeSel.sort();

        if (this.content.typeMenu.isSameSelected(newTypeSel)) {
            return true;
        }

        const typesBefore = this.model.filter.type;
        this.model.filter.type = newTypeSel;
        const expected = this.getExpectedState();

        if (newTypeSel.length === 1) {
            await this.waitForData(() => App.view.content.typeMenu.select(newTypeSel[0]));
        } else {
            // Select new types
            for (const transType of availTransTypes) {
                if (!typesBefore.includes(transType) && newTypeSel.includes(transType)) {
                    await this.waitForData(() => App.view.content.typeMenu.toggle(transType));
                }
            }
            // Deselect previous types
            for (const transType of availTransTypes) {
                if (typesBefore.includes(transType) && !newTypeSel.includes(transType)) {
                    await this.waitForData(() => App.view.content.typeMenu.toggle(transType));
                }
            }
        }

        return App.view.checkState(expected);
    }

    async byAccounts() {
        this.model.filter.byCurrency = false;
        delete this.model.filter.curr_id;

        const account = App.state.getFirstAccount();
        this.model.filter.acc_id = account.id;
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.filterByDropDown.setSelection(0));

        return App.view.checkState(expected);
    }

    async byCurrencies() {
        this.model.filter.byCurrency = true;
        delete this.model.filter.acc_id;

        const currency = App.currency.getItemByIndex(0);
        this.model.filter.curr_id = currency.id;
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.filterByDropDown.setSelection(1));

        return App.view.checkState(expected);
    }

    async selectAccount(accountId) {
        assert(this.content.accountsDropDown, 'Account drop down control not found');

        this.model.filter.acc_id = parseInt(accountId, 10);
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.accountsDropDown.setSelection(accountId));

        return App.view.checkState(expected);
    }

    selectAccountByPos(pos) {
        assert(this.content.accountsDropDown, 'Account drop down control not found');

        return this.selectAccount(this.content.accountsDropDown.content.items[pos].id);
    }

    async selectCurrency(currencyId) {
        assert(this.content.currencyDropDown, 'Currency drop down control not found');

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
        this.model.filter.group = group;
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.groupDropDown.setSelection(group));

        return App.view.checkState(expected);
    }

    noGroup() {
        return this.groupBy(NO_GROUP);
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
        this.model.filter.startDate = start;
        this.model.filter.endDate = end;
        const expected = this.getExpectedState();

        const startDate = new Date(fixDate(start));
        const endDate = new Date(fixDate(end));
        await this.waitForData(() => this.content.dateFilter.selectRange(startDate, endDate));

        return App.view.checkState(expected);
    }

    async clearDateRange() {
        this.model.filter.startDate = null;
        this.model.filter.endDate = null;
        const expected = this.getExpectedState();

        await this.waitForData(() => this.content.dateFilter.clear());

        return App.view.checkState(expected);
    }
}
