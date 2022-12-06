import { assert, navigation, query } from 'jezve-test';
import { AppView } from './AppView.js';
import { App } from '../Application.js';
import { TransactionList } from './component/TransactionList/TransactionList.js';
import { TilesList } from './component/TilesList.js';
import { Widget } from './component/Widget/Widget.js';
import { TilesWidget } from './component/Widget/TilesWidget.js';
import { TransactionsWidget } from './component/Widget/TransactionsWidget.js';

/** Main view class */
export class MainView extends AppView {
    async parseContent() {
        const res = {};

        res.accountsWidget = await TilesWidget.create(
            this,
            await query('.accounts-widget'),
        );

        res.totalsWidget = await Widget.create(
            this,
            await query('.total-widget'),
        );

        res.transactionsWidget = await TransactionsWidget.create(
            this,
            await query('.transactions-widget'),
        );

        res.personsWidget = await TilesWidget.create(
            this,
            await query('.persons-widget'),
        );

        res.statisticsWidget = await Widget.create(
            this,
            await query('.statistics-widget'),
        );

        return res;
    }

    async goToAccounts() {
        assert(this.content.accountsWidget, 'Accounts widget not found');

        await navigation(() => this.content.accountsWidget.clickByTitle());
    }

    async goToNewTransactionByAccount(index) {
        assert(this.content.accountsWidget, 'Accounts widget not found');

        await this.content.accountsWidget.clickTileByIndex(index);
    }

    async goToTransactions() {
        assert(this.content.transactionsWidget, 'Transactions widget not found');

        await navigation(() => this.content.transactionsWidget.clickByTitle());
    }

    async goToPersons() {
        assert(this.content.personsWidget, 'Persons widget not found');

        await navigation(() => this.content.personsWidget.clickByTitle());
    }

    async goToNewTransactionByPerson(index) {
        assert(this.content.personsWidget, 'Persons widget not found');

        await this.content.personsWidget.clickTileByIndex(index);
    }

    async goToStatistics() {
        assert(this.content.statisticsWidget, 'Statistics widget not found');

        await navigation(() => this.content.statisticsWidget.clickByTitle());
    }

    static render(state) {
        const res = {};

        const userAccounts = state.accounts.getUserAccounts();

        // Accounts widget
        res.accountsWidget = {
            title: 'Accounts',
            tiles: TilesList.renderAccounts(userAccounts),
        };

        // Transactions widget
        if (userAccounts.length > 0 || state.persons.length > 0) {
            const latest = state.transactions.slice(
                0,
                App.config.latestTransactions,
            );
            res.transactionsWidget = TransactionList.renderWidget(latest, state);
        }

        // Persons widget
        res.personsWidget = {
            title: 'Persons',
            tiles: TilesList.renderPersons(state.persons, true),
        };

        return res;
    }
}
