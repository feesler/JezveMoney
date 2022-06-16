import { assert, navigation, queryAll } from 'jezve-test';
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
        const widgets = await queryAll('.widget');
        assert(
            widgets?.length === App.config.widgetsCount,
            'Fail to parse main view widgets',
        );

        const res = {};

        res.accountsWidget = await TilesWidget.create(
            this,
            widgets[App.config.AccountsWidgetPos],
        );

        res.totalsWidget = await Widget.create(
            this,
            widgets[App.config.TotalsWidgetPos],
        );

        res.transactionsWidget = await TransactionsWidget.create(
            this,
            widgets[App.config.LatestWidgetPos],
        );

        res.personsWidget = await TilesWidget.create(
            this,
            widgets[App.config.PersonsWidgetPos],
        );

        res.statisticsWidget = await Widget.create(
            this,
            widgets[App.config.StatisticsWidgetPos],
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

        // Accounts widget
        res.accountsWidget = {
            title: 'Accounts',
            tiles: TilesList.renderAccounts(state.accounts.getUserAccounts()),
        };

        // Transactions widget
        const latestTransactionsList = state.transactions.slice(
            0,
            App.config.latestTransactions,
        );
        const transWidget = TransactionList.renderWidget(latestTransactionsList, state);
        res.transactionsWidget = transWidget;

        // Persons widget
        res.personsWidget = {
            title: 'Persons',
            tiles: TilesList.renderPersons(state.persons, true),
        };

        return res;
    }
}
