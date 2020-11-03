import { TestView } from './testview.js';
import { DropDown } from './component/dropdown.js';
import { TransactionTypeMenu } from './component/transactiontypemenu.js';

/** Statistics view class */
export class StatisticsView extends TestView {
    async parseContent() {
        const res = {
            titleEl: await this.query('.content_wrap > .heading > h1'),
        };

        if (!res.titleEl) {
            throw new Error('Wrong statistics view structure');
        }

        res.typeMenu = await TransactionTypeMenu.create(this, await this.query('.trtype-menu'));
        res.title = await this.prop(res.titleEl, 'textContent');

        const filtersList = await this.queryAll('.filters-container .filter-item');
        if (!filtersList || filtersList.length !== 5) {
            throw new Error('Invalid structure of statistics view');
        }

        res.filterByDropDown = await DropDown.createFromChild(this, await this.query('#filter_type'));

        res.accountsDropDown = null;
        if (await this.isVisible(filtersList[1])) {
            res.accountsDropDown = await DropDown.createFromChild(this, await this.query('#acc_id'));
        }

        res.currencyDropDown = null;
        if (await this.isVisible(filtersList[2])) {
            res.currencyDropDown = await DropDown.createFromChild(this, await this.query('#curr_id'));
        }

        res.groupDropDown = await DropDown.createFromChild(this, await this.query('#groupsel'));

        res.chart = {
            elem: await this.query('#chart'),
            bars: [],
        };
        if (!res.chart) {
            throw new Error('Invalid statistics view structure');
        }

        const bars = await this.queryAll(res.chart.elem, 'svg > rect');
        for (const bar of bars) {
            const nodeOpacity = await this.prop(bar, 'attributes.fill-opacity.nodeValue');
            if (nodeOpacity === '1') {
                res.chart.bars.push({
                    elem: bar,
                    height: await this.prop(bar, 'attributes.height.nodeValue'),
                });
            }
        }

        return res;
    }

    async filterByType(type) {
        if (this.content.typeMenu.isSingleSelected(type)) {
            return;
        }

        await this.navigation(() => this.content.typeMenu.select(type));
    }

    async byAccounts() {
        await this.navigation(() => this.content.filterByDropDown.setSelection(0));
    }

    async byCurrencies() {
        await this.navigation(() => this.content.filterByDropDown.setSelection(1));
    }

    async selectAccount(accountId) {
        if (!this.content.accountsDropDown) {
            throw new Error('Account drop down control not found');
        }

        await this.navigation(() => this.content.accountsDropDown.setSelection(accountId));
    }

    async selectAccountByPos(pos) {
        if (!this.content.accountsDropDown) {
            throw new Error('Account drop down control not found');
        }

        await this.selectAccount(this.content.accountsDropDown.items[pos].id);
    }

    async selectCurrency(currencyId) {
        if (!this.content.currencyDropDown) {
            throw new Error('Currency drop down control not found');
        }

        await this.navigation(() => this.content.currencyDropDown.setSelection(currencyId));
    }

    async selectCurrencyByPos(pos) {
        if (this.content.currencyDropDown) {
            await this.selectCurrency(this.content.currencyDropDown.items[pos].id);
        }
    }

    async groupBy(group) {
        await this.navigation(() => this.content.groupDropDown.setSelection(group));
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
