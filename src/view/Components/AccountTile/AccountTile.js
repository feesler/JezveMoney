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
        let res;

        try {
            res = new AccountTile(props);
            res.parse();
        } catch (e) {
            res = null;
        }

        return res;
    }

    /**
     * Render specified account
     * @param {object} account - account object
     */
    render(account) {
        if (!isObject(account)) {
            throw new Error('Invalid account specified');
        }

        const fmtBalance = this.parent.model.currency.formatCurrency(
            account.balance,
            account.curr_id,
        );
        const icon = this.parent.model.icons.getItem(account.icon_id);

        this.setTitle(account.name);
        this.setSubTitle(fmtBalance);
        this.setIcon((icon) ? icon.file : null);
    }
}