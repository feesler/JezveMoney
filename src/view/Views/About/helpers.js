import { createElement } from '@jezvejs/dom';

/* CSS classes */
const PARAGRAPH_CLASS = 'paragraph';

export const createParagraph = (textContent) => (
    createElement('p', {
        props: {
            className: PARAGRAPH_CLASS,
            textContent,
        },
    })
);
