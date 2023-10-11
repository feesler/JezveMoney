import {
    Component,
    createElement,
    isFunction,
    show,
} from 'jezvejs';
import { PieChart } from 'jezvejs/PieChart';

import { __ } from '../../../../utils/utils.js';
import { Transaction } from '../../../../Models/Transaction.js';
import {
    formatDateLabel,
    formatPercent,
    formatValue,
    getDataCategoryName,
} from '../../helpers.js';

import './PieChartGroup.scss';

/* CSS classes */
const CONTAINER_CLASS = 'piechart-group';
const HEADER_CLASS = 'piechart-header';
const HEADER_TYPE_CLASS = 'piechart-header__type';
const HEADER_DATE_CLASS = 'piechart-header__date';
const TOTAL_CLASS = 'piechart-total';
const TOTAL_TITLE_CLASS = 'piechart-total__title';
const TOTAL_VALUE_CLASS = 'piechart-total__value';
const CHART_CONTAINER_CLASS = 'piechart-container';
const INFO_CLASS = 'piechart-info';
const INFO_TITLE_CLASS = 'piechart-info__title';
const INFO_PERCENT_CLASS = 'piechart-info__percent';
const INFO_VALUE_CLASS = 'piechart-info__value';

const defaultProps = {
    data: null,
    radius: 150,
    innerRadius: 120,
    offset: 10,
    onItemOver: null,
    onItemOut: null,
    onItemClick: null,
};

/**
 * Pie chart group component
 */
export class PieChartGroup extends Component {
    static userProps = {
        elem: ['id'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.state = { ...this.props };

        this.init();
        this.postInit();
        this.render(this.state);
    }

    init() {
        // Header
        this.headerType = createElement('div', {
            props: { className: HEADER_TYPE_CLASS },
        });
        this.headerDate = createElement('div', {
            props: { className: HEADER_DATE_CLASS },
        });
        this.header = createElement('header', {
            props: { className: HEADER_CLASS },
            children: [
                this.headerType,
                this.headerDate,
            ],
        });

        // Total
        this.totalTitle = createElement('div', {
            props: {
                className: TOTAL_TITLE_CLASS,
                textContent: __('statistics.total'),
            },
        });
        this.totalValue = createElement('div', {
            props: { className: TOTAL_VALUE_CLASS },
        });
        this.totalContainer = createElement('div', {
            props: { className: TOTAL_CLASS },
            children: [
                this.totalTitle,
                this.totalValue,
            ],
        });

        // Chart info
        this.infoTitle = createElement('div', {
            props: { className: INFO_TITLE_CLASS },
        });
        this.infoPercent = createElement('div', {
            props: { className: INFO_PERCENT_CLASS },
        });
        this.infoValue = createElement('div', {
            props: { className: INFO_VALUE_CLASS },
        });
        this.infoContainer = createElement('div', {
            props: { className: INFO_CLASS },
            children: [
                this.infoTitle,
                this.infoPercent,
                this.infoValue,
            ],
        });

        // Pie chart
        this.chart = PieChart.create({
            data: this.props.data,
            radius: this.props.radius,
            innerRadius: this.props.innerRadius,
            offset: this.props.offset,
            onItemOver: (item) => this.onItemOver(item),
            onItemOut: (item) => this.onItemOut(item),
            onItemClick: (item) => this.onItemClick(item),
        });

        this.chartContainer = createElement('div', {
            props: { className: CHART_CONTAINER_CLASS },
            children: [
                this.infoContainer,
                this.chart.elem,
            ],
        });

        this.elem = createElement('div', {
            props: { className: CONTAINER_CLASS },
            children: [
                this.header,
                this.totalContainer,
                this.chartContainer,
            ],
        });
    }

    postInit() {
        this.setClassNames();
        this.setUserProps();
    }

    /** Pie chart item 'mouseover' event handler */
    onItemOver(item) {
        if (isFunction(this.props.onItemOver)) {
            this.props.onItemOver(item);
        }
    }

    /** Pie chart item 'mouseout' event handler */
    onItemOut(item) {
        if (isFunction(this.props.onItemOut)) {
            this.props.onItemOut(item);
        }
    }

    /** Pie chart item 'click' event handler */
    onItemClick(item) {
        if (isFunction(this.props.onItemClick)) {
            this.props.onItemClick(item);
        }
    }

    renderChart(state) {
        if (!state.selectedColumn) {
            this.chart.hide();
            return;
        }

        this.chart.setData(state.selectedColumn.items);
        this.chart.show();
        this.chart.elem.classList.toggle('categories-report', state.filter.report === 'category');
    }

    renderHeader(state, prevState = {}) {
        if (state.selectedColumn === prevState?.selectedColumn) {
            return;
        }

        if (!state.selectedColumn) {
            this.headerType.textContent = null;
            show(this.pieChartTotal, false);
            return;
        }

        const { groupName, series, total } = state.selectedColumn;
        this.headerType.textContent = Transaction.getTypeTitle(groupName);
        this.headerDate.textContent = formatDateLabel(series, state);

        this.totalValue.textContent = formatValue(total, state);
        show(this.totalContainer, true);
    }

    renderInfo(state, prevState = {}) {
        if (state.pieChartInfo === prevState?.pieChartInfo) {
            return;
        }

        if (!state.pieChartInfo) {
            this.infoTitle.textContent = null;
            this.infoPercent.textContent = null;
            this.infoValue.textContent = null;
            show(this.infoContainer, false);
            return;
        }

        const { categoryId, value } = state.pieChartInfo;
        const { total } = state.selectedColumn;

        this.infoTitle.textContent = getDataCategoryName(categoryId, state);
        this.infoPercent.textContent = formatPercent((value / total) * 100);
        this.infoValue.textContent = formatValue(value, state);

        show(this.infoContainer, true);
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderChart(state, prevState);
        this.renderHeader(state, prevState);
        this.renderInfo(state, prevState);
    }
}
