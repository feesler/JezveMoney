import { asArray } from 'jezvejs';
import { createSlice } from 'jezvejs/Store';
import { formatDateRange, normalize } from '../../utils/utils.js';

const SECTOR_OFFSET = 10;

// Utils
export const isSameSelection = (a, b) => (
    a.length === b.length && a.every((id) => b.includes(id))
);

const pieChartInfoFromSector = (sector) => ({
    category: sector.category,
    categoryId: sector.categoryId,
    value: sector.value,
});

const pieChartInfoFromChartItem = (item) => ({
    value: item.value,
    category: item.categoryIndex + 1,
    categoryId: item.category,
});

// Reducers
const slice = createSlice({
    startLoading: (state) => (
        (state.loading)
            ? state
            : { ...state, loading: true }
    ),

    stopLoading: (state) => (
        (state.loading)
            ? { ...state, loading: false }
            : state
    ),

    changeTypeFilter: (state, type) => (
        (state.filter.type === type)
            ? state
            : {
                ...state,
                form: {
                    ...state.form,
                    type,
                },
            }
    ),

    changeReportType: (state, report) => (
        (state.form.report === report)
            ? state
            : {
                ...state,
                form: {
                    ...state.form,
                    report,
                },
            }
    ),

    changeAccountsFilter: (state, ids) => {
        const accounts = asArray(ids);
        const account = window.app.model.userAccounts.getItem(accounts[0]);
        return {
            ...state,
            form: {
                ...state.form,
                accounts,
            },
            accountCurrency: account?.curr_id ?? 0,
        };
    },

    changeCategoriesFilter: (state, ids) => {
        const categories = asArray(ids);
        return {
            ...state,
            form: {
                ...state.form,
                categories,
            },
        };
    },

    changeCurrencyFilter: (state, currencyId) => (
        (state.form.curr_id === currencyId)
            ? state
            : {
                ...state,
                form: {
                    ...state.form,
                    curr_id: currencyId,
                },
            }
    ),

    changeDateFilter: (state, data) => ({
        ...state,
        form: {
            ...state.form,
            ...data,
        },
    }),

    changeGroupType: (state, group) => (
        (state.form.group === group)
            ? state
            : {
                ...state,
                form: { ...state.form, group },
            }
    ),

    selectDataColumn: (state, target) => {
        const selectedColumn = {
            groupName: target.item.groupName,
            series: target.series,
            items: [],
            total: 0,
        };

        const pieChartInfo = pieChartInfoFromChartItem(target.item);

        target.group.forEach((item) => {
            if (
                selectedColumn.groupName !== item.groupName
                || item.value === 0
            ) {
                return;
            }

            const pieItem = pieChartInfoFromChartItem(item);
            pieItem.offset = (item.category === pieChartInfo.categoryId) ? SECTOR_OFFSET : 0;

            selectedColumn.items.push(pieItem);
            selectedColumn.total = normalize(selectedColumn.total + item.value);
        });

        if (selectedColumn.total === 0) {
            return state;
        }

        return {
            ...state,
            selectedColumn,
            pieChartInfo,
            selectedPieChartItem: pieChartInfo,
        };
    },

    showPieChartInfo: (state, item) => {
        const { sector } = item;
        if (state.pieChartInfo?.category === sector.category) {
            return state;
        }

        return {
            ...state,
            pieChartInfo: pieChartInfoFromSector(sector),
        };
    },

    hidePieChartInfo: (state) => ({
        ...state,
        pieChartInfo: state.selectedPieChartItem,
    }),

    selectPieChartItem: (state, { sector }) => {
        const selectedColumn = {
            ...state.selectedColumn,
            items: state.selectedColumn.items.map((item) => ({
                ...item,
                offset: (item.category === sector?.category && item.offset !== SECTOR_OFFSET)
                    ? SECTOR_OFFSET
                    : 0,
            })),
        };

        const selectedPieChartItem = pieChartInfoFromSector(sector);
        return {
            ...state,
            selectedColumn,
            pieChartInfo: selectedPieChartItem,
            selectedPieChartItem,
        };
    },

    setRenderTime: (state) => ({
        ...state,
        renderTime: Date.now(),
    }),

    dataRequestLoaded: (state, data) => ({
        ...state,
        chartData: { ...data.histogram },
        filter: { ...data.filter },
        form: {
            ...data.filter,
            ...formatDateRange(data.filter),
        },
        selectedColumn: null,
        pieChartInfo: null,
        selectedPieChartItem: null,
    }),

    dataRequestError: (state) => ({
        ...state,
        form: { ...state.filter },
    }),
});

export const { actions, reducer } = slice;
