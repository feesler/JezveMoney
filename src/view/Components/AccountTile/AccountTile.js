import { Tile } from '../Tile/Tile.js';

/**
 * Account Tile component
 * @param {object} props
 */
export class AccountTile extends Tile {
    static create(props) {
        const res = new AccountTile(props);
        res.init();

        return res;
    }

    static fromElement(props) {
        const res = new AccountTile(props);
        res.parse();

        return res;
    }

    init() {
        super.init();

        if (this.props.account) {
            this.setAccount(this.props.account);
        }
    }

    /**
     * Render specified account
     * @param {object} account - account object
     */
    setAccount(account) {
        if (!account) {
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
