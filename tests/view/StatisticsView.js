import {
    query,
    queryAll,
    prop,
    navigation,
    isVisible,
} from 'jezve-test';
import { AppView } from './AppView.js';
import { DropDown } from './component/DropDown.js';
import { TransactionTypeMenu } from './component/TransactionTypeMenu.js';

/** Statistics view class */
export class StatisticsView extends AppView {
    async parseContent() {
        const res = {
            titleEl: await query('.content_wrap > .heading > h1'),
        };

        if (!res.titleEl) {
            throw new Error('Wrong statistics view structure');
        }

        res.typeMenu = await TransactionTypeMenu.create(this, await query('.trtype-menu'));
        res.title = await prop(res.titleEl, 'textContent');

        const filtersList = await queryAll('.filters-container .filter-item');
        if (!filtersList || filtersList.length !== 5) {
            throw new Error('Invalid structure of statistics view');
        }

        res.filterByDropDown = await DropDown.createFromChild(this, await query('#filter_type'));

        res.accountsDropDown = null;
        if (await isVisible(filtersList[1])) {
            res.accountsDropDown = await DropDown.createFromChild(this, await query('#acc_id'));
        }

        res.currencyDropDown = null;
        if (await isVisible(filtersList[2])) {
            res.currencyDropDown = await DropDown.createFromChild(this, await query('#curr_id'));
        }

        res.groupDropDown = await DropDown.createFromChild(this, await query('#groupsel'));

        res.chart = {
            elem: await query('#chart'),
            bars: [],
        };
        if (!res.chart) {
            throw new Error('Invalid statistics view structure');
        }

        const chartChild = await query(res.chart.elem, '.nodata-message');
        if (chartChild) {
            return res;
        }

        const bars = await queryAll(res.chart.elem, 'svg > rect.histogram__bar');
        for (const bar of bars) {
            res.chart.bars.push({
                elem: bar,
                height: await prop(bar, 'attributes.height.nodeValue'),
            });
        }

        return res;
    }

    async filterByType(type) {
        if (this.content.typeMenu.isSingleSelected(type)) {
            return;
        }

        await navigation(() => this.content.typeMenu.select(type));
    }

    async byAccounts() {
        await navigation(() => this.content.filterByDropDown.setSelection(0));
    }

    async byCurrencies() {
        await navigation(() => this.content.filterByDropDown.setSelection(1));
    }

    async selectAccount(accountId) {
        if (!this.content.accountsDropDown) {
            throw new Error('Account drop down control not found');
        }

        await navigation(() => this.content.accountsDropDown.setSelection(accountId));
    }

    async selectAccountByPos(pos) {
        if (!this.content.accountsDropDown) {
            throw new Error('Account drop down control not found');
        }

        await this.selectAccount(this.content.accountsDropDown.content.items[pos].id);
    }

    async selectCurrency(currencyId) {
        if (!this.content.currencyDropDown) {
            throw new Error('Currency drop down control not found');
        }

        await navigation(() => this.content.currencyDropDown.setSelection(currencyId));
    }

    async selectCurrencyByPos(pos) {
        if (this.content.currencyDropDown) {
            await this.selectCurrency(this.content.currencyDropDown.content.items[pos].id);
        }
    }

    async groupBy(group) {
        await navigation(() => this.content.groupDropDown.setSelection(group));
    }

    async noGroup() {
        await this.groupBy(0);
    }

    async groupByDay() {
        await this.groupBy(1);
    }

    async groupByWeek() {
        return this.groupBy(2);
    }

    async groupByMonth() {
        await this.groupBy(3);
    }

    async groupByYear() {
        await this.groupBy(4);
    }
}
