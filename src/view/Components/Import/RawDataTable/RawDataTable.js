import {
    createElement,
    isFunction,
    removeChilds,
    Component,
} from 'jezvejs';
import './style.scss';

/** CSS classes */
const CONTAINER_CLASS = 'raw-data-table';
const HEADER_CLASS = 'raw-data-column__header';
const COLUMN_CLASS = 'raw-data-column';
const CELL_CLASS = 'raw-data-column__cell';
const COLUMN_TPL_CLASS = 'raw-data-column__tpl';
const TABLE_TPL_CLASS = 'raw-data-table__tpl-';
const COLUMN_TPL_PROP_CLASS = 'raw-data-column__tpl-prop';

/** Default properties */
const defaultProps = {
    startFromRow: 2, // first data row, 1-based
    rowsToShow: 3,
};

/**
 * RawDataTable component
 */
export class RawDataTable extends Component {
    static create(props) {
        return new RawDataTable(props);
    }

    constructor(...args) {
        super(...args);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.state = {
            ...this.props,
        };

        this.init();
    }

    init() {
        this.elem = createElement('div', {
            props: { className: CONTAINER_CLASS },
        });

        this.render(this.state);
    }

    /** Column 'click' event handler */
    onColumnClick(index) {
        if (isFunction(this.props.onSelectColumn)) {
            this.props.onSelectColumn(index);
        }
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        // Check there is data to render
        if (!Array.isArray(state.data) || !state.data.length) {
            return;
        }

        // Render data table
        let propertiesPerColumn = 0;
        const headerRow = state.data.slice(0, 1)[0];
        const startRow = state.startFromRow - 1;
        const endRow = Math.min(state.data.length, state.rowsToShow);
        const dataRows = state.data.slice(startRow, endRow);

        const colElems = headerRow.map((title, columnInd) => {
            const tplElem = createElement('div', {
                props: { className: COLUMN_TPL_CLASS },
            });
            if (state.template) {
                const columnsInfo = state.template.getColumnsByIndex(columnInd + 1);
                if (Array.isArray(columnsInfo)) {
                    const columnElems = columnsInfo.map((column) => createElement('div', {
                        props: {
                            className: COLUMN_TPL_PROP_CLASS,
                            textContent: column.title,
                        },
                    }));
                    tplElem.append(...columnElems);

                    propertiesPerColumn = Math.max(propertiesPerColumn, columnElems.length);
                }
            }

            const headElem = createElement('div', {
                props: { className: HEADER_CLASS, textContent: title },
            });
            const columnData = dataRows.map((row) => createElement('div', {
                props: {
                    className: CELL_CLASS,
                    textContent: row[columnInd],
                },
            }));

            return createElement('div', {
                props: { className: COLUMN_CLASS },
                children: [tplElem, headElem, ...columnData],
                events: { click: () => this.onColumnClick(columnInd) },
            });
        });

        removeChilds(this.elem);
        this.elem.append(...colElems);

        if (propertiesPerColumn > 1) {
            this.elem.classList.add(`${TABLE_TPL_CLASS}${propertiesPerColumn}`);
        }
    }
}
