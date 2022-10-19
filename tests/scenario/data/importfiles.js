import { generateCardCSV, generateAccountCSV } from '../../model/import.js';

export const getCardCSV = () => {
    const now = new Date();
    return generateCardCSV([
        [now, 'MOBILE', 'MOSKVA', 'RU', 'RUB', '-500.00'],
        [now, 'SALON', 'SANKT-PETERBU', 'RU', 'RUB', '-80.00'],
        [now, 'OOO SIGMA', 'MOSKVA', 'RU', 'RUB', '-128.00'],
        [now, 'TAXI', 'MOSKVA', 'RU', 'RUB', '-188.00'],
        [now, 'TAXI', 'MOSKVA', 'RU', 'RUB', '-306.00'],
        [now, 'MAGAZIN', 'SANKT-PETERBU', 'RU', 'RUB', '-443.00'],
        [now, 'BAR', 'SANKT-PETERBU', 'RU', 'RUB', '-443.00'],
        [now, 'DOSTAVKA', 'SANKT-PETERBU', 'RU', 'RUB', '-688.00'],
        [now, 'PRODUCTY', 'SANKT-PETERBU', 'RU', 'RUB', '-550.5'],
        [now, 'BOOKING', 'AMSTERDAM', 'NL', 'EUR', '-500.00', 'RUB', '-50 750.35'],
        [now, 'SALARY', 'MOSKVA', 'RU', 'RUB', '100 000.00'],
        [now, 'INTEREST', 'SANKT-PETERBU', 'RU', 'RUB', '23.16'],
        [now, 'RBA R-BANK', 'SANKT-PETERBU', 'RU', 'RUB', '-5 000.00'],
        [now, 'C2C R-BANK', 'SANKT-PETERBU', 'RU', 'RUB', '-10 000.00'],
    ]);
};

export const getAccountCSV = () => {
    const now = new Date();
    return generateAccountCSV([
        [now, 'MOBILE', 'RUB', '-500.00'],
        [now, 'SALON', 'RUB', '-80.00'],
        [now, 'OOO SIGMA', 'RUB', '-128.00'],
        [now, 'TAXI', 'RUB', '-188.00'],
        [now, 'TAXI', 'RUB', '-306.00'],
        [now, 'MAGAZIN', 'RUB', '-443.00'],
        [now, 'BAR', 'RUB', '-443.00'],
        [now, 'DOSTAVKA', 'RUB', '-688.00'],
        [now, 'PRODUCTY', 'RUB', '-550.5'],
        [now, 'BOOKING', 'EUR', '-500.00', 'RUB', '-50 750.35'],
        [now, 'SALARY', 'RUB', '100 000.00'],
        [now, 'CASHBACK', 'PLN', '136.50', 'RUB', '4 257.11'],
        [now, 'INTEREST', 'RUB', '23.16'],
        [now, 'RBA R-BANK', 'RUB', '-5 000.00'],
        [now, 'C2C R-BANK', 'RUB', '-10 000.00'],
    ]);
};
