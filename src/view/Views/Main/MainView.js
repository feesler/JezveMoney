import 'jezvejs/style';
import { ge } from 'jezvejs';
import 'jezvejs/style/IconButton';
import { Histogram } from 'jezvejs/Histogram';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { PersonList } from '../../js/model/PersonList.js';
import { TransactionList } from '../../Components/TransactionList/TransactionList.js';
import '../../Components/Tile/style.scss';
import './style.scss';

/** Strings */
const MSG_NO_TRANSACTIONS = 'No items';

/**
 * Main view
 */
class MainView extends View {
    constructor(...args) {
        super(...args);

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(AccountList, 'accounts', window.app.props.accounts);
        window.app.loadModel(PersonList, 'persons', window.app.props.persons);
    }

    /**
     * View initialization
     */
    onStart() {
        const { accounts, persons } = window.app.model;
        if (accounts.length === 0 && persons.length === 0) {
            return;
        }

        this.latestList = TransactionList.create({
            items: this.props.transactions,
            showControls: false,
            noItemsMessage: MSG_NO_TRANSACTIONS,
        });
        const transactionsWidget = ge('transactionsWidget');
        transactionsWidget.append(this.latestList.elem);

        Histogram.create({
            elem: 'chart',
            data: this.props.chartData,
            height: 200,
        });
    }
}

window.app = new Application(window.appProps);
window.app.createView(MainView);
