import {
    createElement,
    getClassName,
    isFunction,
    removeChilds,
    Component,
} from 'jezvejs';
import './style.scss';

/** CSS classes */
const CONTAINER_CLASS = 'raw-data-table';
const DATA_CLASS = 'raw-data-table__data';
const HEADER_CLASS = 'raw-data-column__header';
const COLUMN_CLASS = 'raw-data-column';
const CELL_CLASS = 'raw-data-column__cell';
const COLUMN_TPL_CLASS = 'raw-data-column__tpl';
const TABLE_TPL_CLASS = 'raw-data-table__tpl-';
const COLUMN_TPL_PROP_CLASS = 'raw-data-column__tpl-prop';
const ROW_NUMBERS_COLUMN_CLASS = 'raw-data-column_row-numbers';

/** Default properties */
const defaultProps = {
    rowsToShow: 3,
};

/**
 * RawDataTable component
 */
export class RawDataTable extends Component {
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

    get scrollLeft() {
        return (this.columnContainer) ? this.columnContainer.scrollLeft : 0;
    }

    set scrollLeft(value) {
        if (this.columnContainer) {
            this.columnContainer.scrollLeft = value;
        }
    }

    getSafeFirstRow(state) {
        if (Number.isNaN(state.template.first_row)) {
            return 1;
        }
        return state.template.first_row;
    }

    /** Column 'click' event handler */
    onColumnClick(index) {
        if (isFunction(this.props.onSelectColumn)) {
            this.props.onSelectColumn(index);
        }
    }

    renderRowNumbersColumn(state) {
        const safeFirstRow = this.getSafeFirstRow(state);
        const startRow = Math.max(safeFirstRow - 1, 1);
        const endRow = Math.min(state.data.length, startRow + state.rowsToShow);

        const tplCell = createElement('div', {
            props: { className: COLUMN_TPL_CLASS },
        });
        const headCell = createElement('div', {
            props: { className: CELL_CLASS, textContent: '1' },
        });
        const cells = [tplCell, headCell];
        for (let ind = startRow; ind < endRow; ind += 1) {
            const cell = createElement('div', {
                props: {
                    className: CELL_CLASS,
                    textContent: ind + 1,
                },
            });
            cells.push(cell);
        }

        return createElement('div', {
            props: { className: getClassName(COLUMN_CLASS, ROW_NUMBERS_COLUMN_CLASS) },
            children: cells,
        });
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

        const safeFirstRow = this.getSafeFirstRow(state);
        const startRow = Math.max(safeFirstRow - 1, 1);
        const endRow = Math.min(state.data.length, startRow + state.rowsToShow);
        const dataRows = state.data.slice(startRow, endRow);

        // Row numbers column
        const rowNumbersColumn = this.renderRowNumbersColumn(state);

        // Data columns
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

        this.columnContainer = createElement('div', {
            props: { className: DATA_CLASS },
            children: colElems,
        });

        removeChilds(this.elem);
        this.elem.append(rowNumbersColumn, this.columnContainer);

        if (propertiesPerColumn > 1) {
            this.elem.classList.add(`${TABLE_TPL_CLASS}${propertiesPerColumn}`);
        }

        if (state.scrollLeft) {
            this.columnContainer.scrollLeft = state.scrollLeft;
        }
    }
}
