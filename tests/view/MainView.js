import {
    assert,
    isVisible,
    navigation,
    prop,
    query,
    click,
    waitForFunction,
} from 'jezve-test';
import { DropDown } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { App } from '../Application.js';
import { __ } from '../model/locale.js';
import { TransactionList } from './component/TransactionList/TransactionList.js';
import { TilesList } from './component/Tiles/TilesList.js';
import { Widget } from './component/Widget/Widget.js';
import { TilesWidget } from './component/Widget/TilesWidget.js';
import { TransactionsWidget } from './component/Widget/TransactionsWidget.js';
import { WarningPopup } from './component/WarningPopup.js';

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

        res.loadingIndicator = { elem: await query('#contentContainer .loading-indicator') };

        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        const categoryDialogElem = await query('#selectCategoryDialog');
        res.selectCategoryDialog = { elem: categoryDialogElem };
        if (categoryDialogElem) {
            const dropDownElem = await query(categoryDialogElem, '.dd__container');
            const categorySelect = await DropDown.create(this, dropDownElem);
            categorySelect.visible = await isVisible(categorySelect.elem, true);

            const okBtn = {
                elem: await query(categoryDialogElem, '.popup__controls .btn.submit-btn'),
            };
            okBtn.visible = await isVisible(okBtn.elem, true);

            const cancelBtn = {
                elem: await query(categoryDialogElem, '.popup__controls .btn.cancel-btn'),
            };
            cancelBtn.visible = await isVisible(cancelBtn.elem, true);

            res.selectCategoryDialog.categorySelect = categorySelect;
            res.selectCategoryDialog.okBtn = okBtn;
            res.selectCategoryDialog.cancelBtn = cancelBtn;
        }

        res.renderTime = await prop(res.accountsWidget?.tiles?.elem, 'dataset.time');

        return res;
    }

    buildModel(cont) {
        const res = {
            locale: cont.locale,
            loading: cont.loadingIndicator.visible,
            renderTime: cont.renderTime,
        };

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

    async goToUpdateTransactionByIndex(index) {
        assert(this.content.transactionsWidget, 'Transactions widget not found');

        return this.content.transactionsWidget.updateByIndex(index);
    }

    /** Select category for specified transaction */
    async setTransactionCategory(index, category) {
        assert(this.content.transactionsWidget, 'Transactions widget not found');

        await this.performAction(() => this.content.transactionsWidget.setCategoryByIndex(index));

        const { selectCategoryDialog } = this.content;
        const { categorySelect } = selectCategoryDialog;
        await this.waitForData(async () => {
            await categorySelect.setSelection(category);
            await click(selectCategoryDialog.okBtn.elem);
        });
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
            title: __('PERSONS', App.view.locale),
            tiles: TilesList.renderPersons(state.persons, true),
        };

        return res;
    }
}
