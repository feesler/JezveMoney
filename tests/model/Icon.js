/** Icon class */
export class Icon {
    static noIcon() {
        return {
            id: 0,
            name: 'No icon',
            file: null,
            type: null,
        };
    }

    constructor(props) {
        Object.keys(props).forEach((key) => {
            this[key] = props[key];
        });
    }
}
