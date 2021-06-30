import { Histogram } from 'jezvejs';
import { View } from './View.js';
import '../css/lib/common.css';
import '../css/lib/iconlink.css';
import '../css/app.css';
import '../css/tiles.css';
import '../css/trlist.css';

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
