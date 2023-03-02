import {
    assert,
    navigation,
    prop,
    query,
    waitForFunction,
} from 'jezve-test';
import { AppView } from './AppView.js';
import { App } from '../Application.js';
import { TransactionList } from './component/TransactionList/TransactionList.js';
import { TilesList } from './component/Tiles/TilesList.js';
import { Widget } from './component/Widget/Widget.js';
import { SummaryWidget } from './component/Widget/SummaryWidget.js';
import { TransactionsWidget } from './component/Widget/TransactionsWidget.js';
import { WarningPopup } from './component/WarningPopup.js';
import { SetCategoryDialog } from './component/SetCategoryDialog.js';

/** Main view class */
export class MainView extends AppView {
    async parseContent() {
        const res = {
            summaryWidget: await SummaryWidget.create(
                this,
                await query('.summary-widget'),
            ),
            totalsWidget: await Widget.create(
                this,
                await query('.total-widget'),
            ),
            transactionsWidget: await TransactionsWidget.create(
                this,
                await query('.transactions-widget'),
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

        res.renderTime = await prop(res.summaryWidget.accountsTab.tiles?.elem, 'dataset.time');

        return res;
    }

    buildModel(cont) {
        const res = {
            locale: cont.locale,
            loading: cont.loadingIndicator.visible,
            renderTime: cont.renderTime,
            summaryTab: cont.summaryWidget.tabs.selectedId,
            showHiddenAccounts: !!cont.summaryWidget.accountsTab.hiddenTiles?.content?.visible,
            showHiddenPersons: !!cont.summaryWidget.personsTab.hiddenTiles?.content?.visible,
        };

        return res;
    }

    getExpectedState(model = this.model) {
        const userAccounts = App.state.getUserAccounts();
        const visibleAccounts = userAccounts.getVisible(true);
        const hiddenAccounts = userAccounts.getHidden(true);
        const hasHiddenAccounts = hiddenAccounts.length > 0;
        const showAccountsTab = model.summaryTab === 'accounts';

        const visiblePersons = App.state.persons.getVisible(true);
        const hiddenPersons = App.state.persons.getHidden(true);
        const hasHiddenPersons = hiddenPersons.length > 0;
        const showPersonsTab = model.summaryTab === 'persons';

        const accountsTab = {
            visible: showAccountsTab,
            tiles: TilesList.renderAccounts(userAccounts),
            hiddenTiles: TilesList.renderHiddenAccounts(userAccounts),
            toggleHiddenBtn: { visible: showAccountsTab && hasHiddenAccounts },
        };
        accountsTab.tiles.visible = showAccountsTab;
        accountsTab.tiles.noDataMsg = {
            visible: (showAccountsTab && visibleAccounts.length === 0),
        };
        accountsTab.hiddenTiles.visible = (
            showAccountsTab
            && hasHiddenAccounts
            && model.showHiddenAccounts
        );

        const personsTab = {
            visible: showPersonsTab,
            tiles: TilesList.renderPersons(App.state.persons, true),
            hiddenTiles: TilesList.renderHiddenPersons(App.state.persons, true),
            toggleHiddenBtn: { visible: showPersonsTab && hasHiddenPersons },
        };
        personsTab.tiles.visible = showPersonsTab;
        personsTab.tiles.noDataMsg = {
            visible: (showPersonsTab && visiblePersons.length === 0),
        };
        personsTab.hiddenTiles.visible = (
            showPersonsTab
            && hasHiddenPersons
            && model.showHiddenPersons
        );

        const res = {
            summaryWidget: {
                accountsTab,
                personsTab,
            },
        };

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

    async showAccountsTab() {
        if (this.model.summaryTab === 'accounts') {
            return true;
        }

        this.model.summaryTab = 'accounts';
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.summaryWidget.showAccounts());

        return this.checkState(expected);
    }

    async showPersonsTab() {
        if (this.model.summaryTab === 'persons') {
            return true;
        }

        this.model.summaryTab = 'persons';
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.summaryWidget.showPersons());

        return this.checkState(expected);
    }

    async toggleHiddenAccounts() {
        assert(this.content.summaryWidget, 'Summary widget not found');

        await this.showAccountsTab();

        const hiddenAccounts = App.state.getUserAccounts().getHidden(true);
        assert(hiddenAccounts.length > 0, 'No hidden accounts');

        this.model.showHiddenAccounts = !this.model.showHiddenAccounts;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.summaryWidget.accountsTab.toggleHidden());

        return this.checkState(expected);
    }

    async goToNewTransactionByAccount(index) {
        assert(this.content.summaryWidget, 'Summary widget not found');

        await this.showAccountsTab();
        await this.content.summaryWidget.accountsTab.clickTileByIndex(index);
    }

    async goToTransactions() {
        assert(this.content.transactionsWidget, 'Transactions widget not found');

        await navigation(() => this.content.transactionsWidget.clickByTitle());
    }

    async toggleHiddenPersons() {
        assert(this.content.summaryWidget, 'Summary widget not found');

        await this.showPersonsTab();

        const hiddenPersons = App.state.persons.getHidden(true);
        assert(hiddenPersons.length > 0, 'No hidden persons');

        this.model.showHiddenPersons = !this.model.showHiddenPersons;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.summaryWidget.personsTab.toggleHidden());

        return this.checkState(expected);
    }

    async goToNewTransactionByPerson(index) {
        assert(this.content.summaryWidget, 'Persons widget not found');

        await this.showPersonsTab();
        await this.content.summaryWidget.personsTab.clickTileByIndex(index);
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
        const visibleAccounts = userAccounts.getVisible(true);

        // Accounts widget
        const accountsTab = {
            tiles: TilesList.renderAccounts(userAccounts),
            hiddenTiles: TilesList.renderHiddenAccounts(userAccounts),
        };
        accountsTab.tiles.visible = true;
        accountsTab.tiles.noDataMsg = { visible: visibleAccounts.length === 0 };
        accountsTab.hiddenTiles.visible = false;

        const personsTab = {
            tiles: TilesList.renderPersons(state.persons, true),
            hiddenTiles: TilesList.renderHiddenPersons(state.persons, true),
        };
        personsTab.tiles.visible = false;
        personsTab.tiles.noDataMsg = { visible: false };
        personsTab.hiddenTiles.visible = false;

        res.summaryWidget = {
            accountsTab,
            personsTab,
        };

        // Transactions widget
        if (userAccounts.length > 0 || state.persons.length > 0) {
            const latest = state.transactions.slice(
                0,
                App.config.latestTransactions,
            );
            res.transactionsWidget = TransactionList.renderWidget(latest, state);
        }

        return res;
    }
}
