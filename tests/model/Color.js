/** Color class */
export class Color {
    constructor(props) {
        Object.keys(props).forEach((key) => {
            this[key] = props[key];
        });
    }
}
