import { isFunction, isObject } from 'jezvejs';

class Store {
    constructor(reducer, initialState = {}) {
        if (!isFunction(reducer)) {
            throw new Error('Expected reducer to be a function');
        }

        this.reducer = reducer;
        this.state = { ...initialState };
        this.listeners = [];
    }

    getState() {
        return this.state;
    }

    dispatch(action) {
        const newState = this.reducer(this.state, action);
        const prevState = this.state;
        this.state = newState;
        this.listeners.forEach((listener) => listener(newState, prevState));
    }

    subscribe(listener) {
        if (!isFunction(listener)) {
            throw new Error('Expected listener to be a function');
        }

        // Don't subscribe same listener twice
        if (this.listeners.some((l) => l === listener)) {
            return;
        }

        this.listeners.push(listener);
    }
}

export const createStore = (...args) => (new Store(...args));

export const createSlice = (reducers) => {
    if (!isObject(reducers)) {
        throw new Error('Invalid actions object');
    }

    const slice = {
        actions: {},
        reducers: {},
    };

    Object.keys(reducers).forEach((action) => {
        slice.actions[action] = (payload) => ({ type: action, payload });
        slice.reducers[action] = reducers[action];
    });

    slice.reducer = (state, action) => {
        if (!(action.type in slice.reducers)) {
            throw new Error('Invalid action type');
        }

        const reduceFunc = slice.reducers[action.type];
        return reduceFunc(state, action.payload);
    };

    return slice;
};
