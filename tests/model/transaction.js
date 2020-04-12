// Types of transactions
export const EXPENSE = 1;
export const INCOME = 2;
export const TRANSFER = 3;
export const DEBT = 4;

export const availTransTypes = [ EXPENSE, INCOME, TRANSFER, DEBT ];


export class Transaction
{
	// Return string for specified type of transaction
	static typeToStr(type)
	{
		const typeToStr = {
			[EXPENSE] : 'expense',
			[INCOME] : 'income',
			[TRANSFER] : 'transfer',
			[DEBT] : 'debt'
		};

		if (!type || !(type in typeToStr))
			throw new Error('Unknown transaction type ' + type);

		return typeToStr[type];
	}


	static strToType(str)
	{
		const strToType = {
			'ALL' : 0,
			'EXPENSE' : EXPENSE,
			'INCOME' : INCOME,
			'TRANSFER' : TRANSFER,
			'DEBT' : DEBT
		};

		if (!str)
			return null;

		let key = str.toUpperCase();
		return (key in strToType) ? strToType[key] : null;
	}
}
