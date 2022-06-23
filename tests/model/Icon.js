/** Icon class */
export class Icon {
    constructor(props) {
        Object.keys(props).forEach((key) => {
            this[key] = props[key];
        });
    }

    static noIcon() {
        return {
            id: 0,
            name: 'No icon',
            file: null,
            type: null,
        };
    }
}
