import {
    assert,
    navigation,
    prop,
    query,
    waitForFunction,
} from 'jezve-test';
import { AppView } from './AppView.js';
import { App } from '../Application.js';
import { __ } from '../model/locale.js';
import { TransactionList } from './component/TransactionList/TransactionList.js';
import { TilesList } from './component/Tiles/TilesList.js';
import { Widget } from './component/Widget/Widget.js';
import { TilesWidget } from './component/Widget/TilesWidget.js';
import { TransactionsWidget } from './component/Widget/TransactionsWidget.js';
import { WarningPopup } from './component/WarningPopup.js';
import { SetCategoryDialog } from './component/SetCategoryDialog.js';

/** Main view class */
export class MainView extends AppView {
    async parseContent() {
        const res = {
            accountsWidget: await TilesWidget.create(
                this,
                await query('.accounts-widget'),
            ),
            totalsWidget: await Widget.create(
                this,
                await query('.total-widget'),
            ),
            transactionsWidget: await TransactionsWidget.create(
                this,
                await query('.transactions-widget'),
            ),
            personsWidget: await TilesWidget.create(
                this,
                await query('.persons-widget'),
            ),
            statisticsWidget: await Widget.create(
                this,
                await query('.statistics-widget'),
            ),
            loadingIndicator: { elem: await query('#contentContainer .loading-indicator') },
            delete_warning: await WarningPopup.create(this, await query('#delete_warning')),
            selectCategoryDialog: await SetCategoryDialog.create(
                this,
                await query('#selectCategoryDialog'),
            ),
        };

        res.renderTime = await prop(res.accountsWidget?.tiles?.elem, 'dataset.time');

        return res;
    }

    buildModel(cont) {
        const res = {
            locale: cont.locale,
            loading: cont.loadingIndicator.visible,
            renderTime: cont.renderTime,
            showHiddenAccounts: !!cont.accountsWidget.hiddenTiles?.content?.visible,
            showHiddenPersons: !!cont.personsWidget.hiddenTiles?.content?.visible,
        };

        return res;
    }

    getExpectedState(model = this.model) {
        const userAccounts = App.state.getUserAccounts();
        const hiddenUserAccounts = userAccounts.getHidden(true);
        const hiddenPersons = App.state.persons.getHidden(true);
        const hasHiddenAccounts = hiddenUserAccounts.length > 0;
        const hasHiddenPersons = hiddenPersons.length > 0;

        const res = {
            accountsWidget: {
                visible: true,
                title: __('ACCOUNTS', App.view.locale),
                tiles: TilesList.renderAccounts(userAccounts),
                hiddenTiles: TilesList.renderHiddenAccounts(userAccounts),
                toggleHiddenBtn: { visible: hasHiddenAccounts },
            },
            personsWidget: {
                visible: true,
                title: __('PERSONS', App.view.locale),
                tiles: TilesList.renderPersons(App.state.persons, true),
                hiddenTiles: TilesList.renderHiddenPersons(App.state.persons, true),
                toggleHiddenBtn: { visible: hasHiddenPersons },
            },
        };

        res.accountsWidget.hiddenTiles.visible = hasHiddenAccounts && model.showHiddenAccounts;
        res.personsWidget.hiddenTiles.visible = hasHiddenPersons && model.showHiddenPersons;

        // Transactions widget
        if (userAccounts.length > 0 || App.state.persons.length > 0) {
            const latest = App.state.transactions.slice(
                0,
                App.config.latestTransactions,
            );
            res.transactionsWidget = TransactionList.renderWidget(latest, App.state);
        }

        return res;
    }

    /** Wait for load of view */
    async waitForLoad() {
        await this.parse();

        await waitForFunction(async () => {
            await this.parse();
            return !this.model.loading;
        });

        await this.parse();
    }

    /** Run action and wait until data loaded */
    async waitForData(action) {
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

    async goToAccounts() {
        assert(this.content.accountsWidget, 'Accounts widget not found');

        await navigation(() => this.content.accountsWidget.clickByTitle());
    }

    async toggleHiddenAccounts() {
        assert(this.content.accountsWidget, 'Accounts widget not found');

        const hiddenUserAccounts = App.state.getUserAccounts().getHidden(true);
        assert(hiddenUserAccounts.length > 0, 'No hidden accounts');

        this.model.showHiddenAccounts = !this.model.showHiddenAccounts;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.accountsWidget.toggleHidden());

        return this.checkState(expected);
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

    async toggleHiddenPersons() {
        assert(this.content.personsWidget, 'Persons widget not found');

        const hiddenPersons = App.state.persons.getHidden(true);
        assert(hiddenPersons.length > 0, 'No hidden persons');

        this.model.showHiddenPersons = !this.model.showHiddenPersons;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.personsWidget.toggleHidden());

        return this.checkState(expected);
    }

    async goToNewTransactionByPerson(index) {
        assert(this.content.personsWidget, 'Persons widget not found');

        await this.content.personsWidget.clickTileByIndex(index);
    }

    async goToStatistics() {
        assert(this.content.statisticsWidget, 'Statistics widget not found');

        await navigation(() => this.content.statisticsWidget.clickByTitle());
    }

    async goToUpdateTransactionByIndex(index) {
        assert(this.content.transactionsWidget, 'Transactions widget not found');

        return this.content.transactionsWidget.updateByIndex(index);
    }

    /** Select category for specified transaction */
    async setTransactionCategory(index, category) {
        assert(this.content.transactionsWidget, 'Transactions widget not found');

        await this.performAction(() => this.content.transactionsWidget.setCategoryByIndex(index));
        const { selectCategoryDialog } = this.content;
        assert(selectCategoryDialog, 'Select category dialog not found');

        await this.waitForData(() => selectCategoryDialog.selectCategoryAndSubmit(category));
    }

    async deleteTransactionByIndex(index) {
        await this.performAction(() => this.content.transactionsWidget.deleteByIndex(index));

        assert(this.content.delete_warning?.content?.visible, 'Delete transaction warning popup not appear');

        await this.waitForData(() => this.content.delete_warning.clickOk());
    }

    static render(state) {
        const res = {};

        const userAccounts = state.accounts.getUserAccounts();

        // Accounts widget
        res.accountsWidget = {
            title: __('ACCOUNTS', App.view.locale),
            tiles: TilesList.renderAccounts(userAccounts),
            hiddenTiles: TilesList.renderHiddenAccounts(userAccounts),
        };
        res.accountsWidget.hiddenTiles.visible = false;

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
            title: __('PERSONS', App.view.locale),
            tiles: TilesList.renderPersons(state.persons, true),
            hiddenTiles: TilesList.renderHiddenPersons(state.persons, true),
        };
        res.personsWidget.hiddenTiles.visible = false;

        return res;
    }
}
