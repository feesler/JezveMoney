import { isObject } from 'jezvejs';
import { Tile } from '../Tile/Tile.js';

/**
 * Account Tile component
 * @param {object} props
 */
export class AccountTile extends Tile {
    constructor(...args) {
        super(...args);

        this.parent = this.props.parent;
    }

    /**
     * Create new Account Tile from specified element
     */
    static fromElement(props) {
        const res = new AccountTile(props);
        res.parse();

        return res;
    }

    /**
     * Render specified account
     * @param {object} account - account object
     */
    setAccount(account) {
        if (!isObject(account)) {
            throw new Error('Invalid account specified');
        }

        const fmtBalance = window.app.model.currency.formatCurrency(
            account.balance,
            account.curr_id,
        );
        const icon = window.app.model.icons.getItem(account.icon_id);

        this.setState({
            ...this.state,
            title: account.name,
            subtitle: fmtBalance,
            icon: (icon) ? icon.file : null,
        });
    }
}
