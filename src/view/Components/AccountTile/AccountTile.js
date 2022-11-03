import { Component } from 'jezvejs';
import { Tile } from '../Tile/Tile.js';

/**
 * Account Tile component
 * @param {object} props
 */
export class AccountTile extends Component {
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
        const { currency, icons } = window.app.model;
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
