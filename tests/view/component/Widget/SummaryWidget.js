import { assert } from '@jezvejs/assert';
import {
    query,
    asyncMap,
} from 'jezve-test';
import { TabList } from 'jezvejs-test';
import { Widget } from './Widget.js';
import { SummaryList } from './SummaryList.js';

const tabsMap = {
    accounts: 'accountsTab',
    persons: 'personsTab',
};

export class SummaryWidget extends Widget {
    async parseContent() {
        const res = await super.parseContent();

        res.tabs = await TabList.create(this, await query(this.elem, '.tab-list'));

        await asyncMap(
            res.tabs.items,
            async (item) => {
                const name = tabsMap[item.id];
                assert.isString(name, `Invalid item id: ${item.id}`);

                res[name] = await SummaryList.create(this, item.elem);
            },
        );

        return res;
    }

    get tabs() {
        return this.content.tabs;
    }

    get accountsTab() {
        return this.content.accountsTab;
    }

    get personsTab() {
        return this.content.personsTab;
    }

    async selectTabById(id) {
        return this.tabs.selectTabById(id);
    }

    async showAccounts() {
        return this.tabs.selectTabById('accounts');
    }

    async showPersons() {
        return this.tabs.selectTabById('persons');
    }
}
