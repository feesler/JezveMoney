import { isFunction } from 'jezvejs';

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
        this.state = newState;
        this.listeners.forEach((listener) => listener(newState));
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
