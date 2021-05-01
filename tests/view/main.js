import { AppView } from './AppView.js';
import { App } from '../app.js';
import { TransactionList } from './component/transactionlist.js';
import { TilesList } from './component/tileslist.js';
import { Tile } from './component/tile.js';
import { InfoTile } from './component/infotile.js';

/** Main view class */
export class MainView extends AppView {
    async parseContent() {
        const widgetsElem = await this.queryAll('.content_wrap .widget');
        if (!widgetsElem) {
            throw new Error('Fail to parse main view widgets');
        }

        const res = {
            widgets: [],
        };

        for (const elem of widgetsElem) {
            const widget = {
                elem,
                titleElem: await this.query(elem, '.widget_title'),
                linkElem: await this.query(elem, '.widget_title > a'),
                textElem: await this.query(elem, '.widget_title span'),
            };

            if (widget.linkElem) {
                widget.link = await this.prop(widget.linkElem, 'href');
            }
            if (widget.textElem) {
                widget.title = await this.prop(widget.textElem, 'textContent');
            }

            const tiles = await TilesList.create(this, await this.query('.tiles'), Tile);
            if (tiles) {
                widget.tiles = tiles;
            }

            const infoTiles = await TilesList.create(this, await this.query(widget.elem, '.info-tiles'), InfoTile);
            if (infoTiles) {
                widget.infoTiles = infoTiles;
            }

            const transactions = await TransactionList.create(this, await this.query(widget.elem, '.trans-list'));
            if (transactions) {
                widget.transList = transactions;
            }

            res.widgets.push(widget);
        }

        return res;
    }

    async goToAccounts() {
        if (!this.content.widgets || !this.content.widgets[App.config.AccountsWidgetPos]) {
            throw new Error('Accounts widget not found');
        }

        const widget = this.content.widgets[App.config.AccountsWidgetPos];
        if (widget.title !== 'Accounts') {
            throw new Error('Invalid accounts widget');
        }

        await this.navigation(() => this.click(widget.linkElem));
    }

    async goToNewTransactionByAccount(accNum) {
        if (!this.content.widgets || !this.content.widgets[App.config.AccountsWidgetPos]) {
            throw new Error('Wrong state of main view');
        }

        const accWidget = this.content.widgets[App.config.AccountsWidgetPos];
        if (accWidget.title !== 'Accounts') {
            throw new Error('Wrong state of accounts widget');
        }

        if (!accWidget.tiles || accWidget.tiles.items.length <= accNum) {
            throw new Error(`Tile ${accNum} not found`);
        }

        const tile = accWidget.tiles.items[accNum];
        const link = tile.linkElem;

        await this.navigation(() => this.click(link));
    }

    async goToTransactions() {
        if (
            !this.content
            || !this.content.widgets
            || this.content.widgets.length !== App.config.widgetsCount
        ) {
            throw new Error('Fail to parse main view widgets');
        }

        const widget = this.content.widgets[App.config.LatestWidgetPos];
        if (widget.title !== 'Transactions') {
            throw new Error('Invalid transactions widget');
        }

        await this.navigation(() => this.click(widget.linkElem));
    }

    async goToPersons() {
        if (
            !this.content
            || !this.content.widgets
            || this.content.widgets.length !== App.config.widgetsCount
        ) {
            throw new Error('Fail to parse main view widgets');
        }

        const widget = this.content.widgets[App.config.PersonsWidgetPos];
        if (widget.title !== 'Persons') {
            throw new Error('Invalid persons widget');
        }

        await this.navigation(() => this.click(widget.linkElem));
    }

    async goToStatistics() {
        if (
            !this.content
            || !this.content.widgets
            || this.content.widgets.length !== App.config.widgetsCount
        ) {
            throw new Error('Fail to parse main view widgets');
        }

        const widget = this.content.widgets[App.config.StatisticsWidgetPos];
        if (widget.title !== 'Statistics') {
            throw new Error('Invalid statistics widget');
        }

        await this.navigation(() => this.click(widget.linkElem));
    }

    static render(state) {
        const res = {
            values: {
                widgets: { length: App.config.widgetsCount },
            },
        };

        // Accounts widget
        const accWidget = { tiles: TilesList.renderAccounts(state.accounts.getUserAccounts()) };
        res.values.widgets[App.config.AccountsWidgetPos] = accWidget;
        // Persons widget
        const personsWidget = { infoTiles: TilesList.renderPersons(state.persons, InfoTile) };
        res.values.widgets[App.config.PersonsWidgetPos] = personsWidget;

        // Transactions widget
        const latestTransactionsList = state.transactions.slice(
            0,
            App.config.latestTransactions,
        );
        const transWidget = TransactionList.renderWidget(latestTransactionsList, state);
        res.values.widgets[App.config.LatestWidgetPos] = transWidget;

        return res;
    }
}
