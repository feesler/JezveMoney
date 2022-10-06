import 'jezvejs/style';
import { Histogram } from 'jezvejs/Histogram';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import { TransactionList } from '../../Components/TransactionList/TransactionList.js';
import '../../Components/IconLink/style.scss';
import '../../css/app.scss';
import '../../Components/Tile/style.scss';
import './style.scss';

/**
 * Main view
 */
class MainView extends View {
    /**
     * View initialization
     */
    onStart() {
        TransactionList.create({
            elem: document.querySelector('.transactions-widget .trans-list'),
            items: this.props.transactions,
        });

        Histogram.create({
            elem: 'chart',
            data: this.props.chartData,
            height: 200,
        });
    }
}

window.app = new Application(window.appProps);
window.app.createView(MainView);
