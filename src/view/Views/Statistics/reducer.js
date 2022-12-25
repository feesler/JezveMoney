import { asArray } from 'jezvejs';
import { createSlice } from '../../js/store.js';
import { normalize } from '../../js/utils.js';

const groupTypes = [null, 'day', 'week', 'month', 'year'];

const SECTOR_OFFSET = 10;

// Utils
export const isSameSelection = (a, b) => (
    a.length === b.length && a.every((id) => b.includes(id))
);

export const getGroupTypeByName = (name) => {
    const groupName = (name) ? name.toLowerCase() : null;
    return groupTypes.indexOf(groupName);
};

const pieChartInfoFromSector = (sector) => ({
    category: sector.category,
    categoryId: sector.categoryId,
    value: sector.value,
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
                acc_id: accounts,
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
                category_id: categories,
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

    changeGroupType: (state, value) => {
        if (state.form.group === value) {
            return state;
        }

        const form = { ...state.form };
        const groupId = parseInt(value, 10);
        const group = (groupId < groupTypes.length) ? groupTypes[groupId] : null;
        if (group) {
            form.group = group;
        } else if ('group' in form) {
            delete form.group;
        }

        return { ...state, form };
    },

    selectDataColumn: (state, target) => {
        const selectedColumn = {
            groupName: target.item.groupName,
            series: target.series,
            items: [],
            total: 0,
        };

        target.group.forEach((item) => {
            if (
                selectedColumn.groupName !== item.groupName
                || item.value === 0
            ) {
                return;
            }

            selectedColumn.items.push({
                value: item.value,
                category: item.categoryIndex + 1,
                categoryId: item.category,
            });
            selectedColumn.total = normalize(selectedColumn.total + item.value);
        });

        if (selectedColumn.total === 0) {
            return state;
        }

        const pieChartInfo = (selectedColumn.items.length === 1)
            ? selectedColumn.items[0]
            : null;

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
        const selectedColumn = (sector?.categoryId !== 0)
            ? {
                ...state.selectedColumn,
                items: state.selectedColumn.items.map((item) => ({
                    ...item,
                    offset: (item.category === sector?.category && item.offset !== SECTOR_OFFSET)
                        ? SECTOR_OFFSET
                        : 0,
                })),
            }
            : state.selectedColumn;

        const selectedPieChartItem = pieChartInfoFromSector(sector);
        return {
            ...state,
            selectedColumn,
            pieChartInfo: selectedPieChartItem,
            selectedPieChartItem,
        };
    },

    dataRequestLoaded: (state, data) => ({
        ...state,
        chartData: { ...data.histogram },
        filter: { ...data.filter },
        form: { ...data.filter },
        selectedColumn: null,
        pieChartInfo: null,
        selectedPieChartItem: null,
        renderTime: Date.now(),
    }),

    dataRequestError: (state) => ({
        ...state,
        form: { ...state.filter },
    }),
});

export const { actions, reducer } = slice;
