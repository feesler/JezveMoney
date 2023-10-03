import { Component } from 'jezvejs';

import { App } from '../../../Application/App.js';

import { Tile } from '../Tile/Tile.js';

/**
 * Account Tile component
 * @param {object} props
 */
export class AccountTile extends Component {
    static get selector() {
        return Tile.selector;
    }

    static get sortSelector() {
        return Tile.sortSelector;
    }

    constructor(props) {
        super(props);

        this.state = {
            ...this.props,
        };

        this.tile = Tile.create(this.props);
        this.elem = this.tile.elem;

        this.render(this.state);
    }

    get id() {
        return this.state.account.id;
    }

    render(state) {
        const { currency, icons } = App.model;
        const { account } = state;

        const fmtBalance = (account)
            ? currency.formatCurrency(account.balance, account.curr_id)
            : null;
        const icon = icons.getItem(account?.icon_id);

        this.tile.setState((tileState) => ({
            ...tileState,
            ...state,
            title: account?.name,
            subtitle: fmtBalance,
            icon: icon?.file,
        }));
    }
}
