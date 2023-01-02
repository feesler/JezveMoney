import 'jezvejs/style';
import { ge } from 'jezvejs';
import 'jezvejs/style/IconButton';
import { Histogram } from 'jezvejs/Histogram';
import { formatValueShort, __ } from '../../js/utils.js';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { PersonList } from '../../js/model/PersonList.js';
import { CategoryList } from '../../js/model/CategoryList.js';
import { TransactionList } from '../../Components/TransactionList/TransactionList.js';
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
        window.app.loadModel(CategoryList, 'categories', window.app.props.categories);
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
            noItemsMessage: __('MAIN_TR_NO_DATA'),
        });
        const transactionsWidget = ge('transactionsWidget');
        transactionsWidget.append(this.latestList.elem);

        const histogram = Histogram.create({
            data: this.props.chartData,
            height: 200,
            renderYAxisLabel: (value) => formatValueShort(value),
        });
        const chart = ge('chart');
        chart.append(histogram.elem);
    }
}

window.app = new Application(window.appProps);
window.app.createView(MainView);
