import { Histogram } from 'jezvejs';
import { View } from '../../js/View.js';
import '../../css/common.css';
import '../../Components/IconLink/style.css';
import '../../css/app.css';
import '../../Components/Tile/style.css';
import '../../Components/TransactionsList/style.css';
import './style.css';

/**
 * Main view
 */
class MainView extends View {
    constructor(...args) {
        super(...args);

        this.model = {};
    }

    /**
     * View initialization
     */
    onStart() {
        Histogram.create({
            elem: 'chart',
            data: this.props.chartData,
            height: 200,
        });
    }
}

window.view = new MainView(window.app);
