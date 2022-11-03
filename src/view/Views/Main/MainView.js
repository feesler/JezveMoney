import 'jezvejs/style';
import { ge } from 'jezvejs';
import { Histogram } from 'jezvejs/Histogram';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { PersonList } from '../../js/model/PersonList.js';
import { TransactionList } from '../../Components/TransactionList/TransactionList.js';
import '../../Components/IconButton/style.scss';
import '../../Components/Tile/style.scss';
import './style.scss';

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
        const transactionsWidget = ge('transactionsWidget');
        this.latestList = TransactionList.create({
            items: this.props.transactions,
            showControls: false,
        });
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
