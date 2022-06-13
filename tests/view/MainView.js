import { assert, navigation, queryAll } from 'jezve-test';
import { AppView } from './AppView.js';
import { App } from '../Application.js';
import { TransactionList } from './component/TransactionList/TransactionList.js';
import { TilesList } from './component/TilesList.js';
import { InfoTile } from './component/InfoTile.js';
import { Widget } from './component/Widget/Widget.js';
import { AccountsWidget } from './component/Widget/AccountsWidget.js';
import { PersonsWidget } from './component/Widget/PersonsWidget.js';
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

        res.accountsWidget = await AccountsWidget.create(
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

        res.personsWidget = await PersonsWidget.create(
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

    async goToNewTransactionByAccount(accNum) {
        assert(this.content.accountsWidget, 'Accounts widget not found');

        await this.content.accountsWidget.clickAccountByIndex(accNum);
    }

    async goToTransactions() {
        assert(this.content.transactionsWidget, 'Transactions widget not found');

        await navigation(() => this.content.transactionsWidget.clickByTitle());
    }

    async goToPersons() {
        assert(this.content.personsWidget, 'Persons widget not found');

        await navigation(() => this.content.personsWidget.clickByTitle());
    }

    async goToStatistics() {
        assert(this.content.statisticsWidget, 'Statistics widget not found');

        await navigation(() => this.content.statisticsWidget.clickByTitle());
    }

    static render(state) {
        const res = {};

        // Accounts widget
        res.accountsWidget = {
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
            infoTiles: TilesList.renderPersons(state.persons, InfoTile),
        };

        return res;
    }
}
