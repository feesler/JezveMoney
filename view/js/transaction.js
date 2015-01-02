// Correct calculated value
function correct(val, prec)
{
	prec = prec || 2;

	return parseFloat(parseFloat(val).toFixed(prec));
}


// Correct calculated exchange rate value
function correctExch(val)
{
	return correct(val, 5);
}


// Localy cancel actions of current transaction
function calcelTransaction()
{
	var srcAcc, destAcc;

	if (!edit_mode || canceled || !edit_transaction)
		return;

	srcAcc = getAccount(edit_transaction.srcAcc);
	destAcc = getAccount(edit_transaction.destAcc);

	if (edit_transaction.type == 1)		// Expense
	{
		if (!srcAcc)
			throw new Error('Invalid transaction: Account not found');
		if (srcAcc[1] != edit_transaction.srcCurr)
			throw new Error('Invalid transaction');

		srcAcc[3] += edit_transaction.srcAmount;
	}
	else if (edit_transaction.type == 2)		// Income
	{
		if (!destAcc || destAcc[1] != edit_transaction.destCurr)
			throw new Error('Invalid transaction');

		destAcc[3] -= edit_transaction.destAmount;
	}
	else if (edit_transaction.type == 3)		// Transfer
	{
		if (!srcAcc || !destAcc || srcAcc[1] != edit_transaction.srcCurr || destAcc[1] != edit_transaction.destCurr)
			throw new Error('Invalid transaction');

		srcAcc[3] += edit_transaction.srcAmount;
		destAcc[3] -= edit_transaction.destAmount;
	}
	else if (edit_transaction.type == 4)		// Debt
	{
		if (debtType)		// person give
		{
			if (srcAcc)
				throw new Error('Invalid transaction');

			srcAcc = getPersonAccount(edit_transaction.srcAcc);
			if (!srcAcc)
				throw new Error('Invalid transaction');

			srcAcc[2] += edit_transaction.srcAmount;
			if (destAcc)
				destAcc[3] -= edit_transaction.destAmount;
		}
		else				// person take
		{
			if (destAcc)		// we should not find acount
				throw new Error('Invalid transaction');

			destAcc = getPersonAccount(edit_transaction.destAcc);
			if (!destAcc)
				throw new Error('Invalid transaction');

			if (srcAcc)
				srcAcc[3] += edit_transaction.srcAmount;
			destAcc[2] -= edit_transaction.destAmount;
		}
	}


	canceled = true;
}


// Normalize monetary value from string
function normalize(val, prec)
{
	prec = prec || 2;

	return parseFloat(parseFloat(fixFloat(val)).toFixed(prec));
}


// Normalize exchange rate value from string
function normalizeExch(val)
{
	return normalize(val, 5);
}


// Check value is valid
function isValidValue(val)
{
	return (val != undefined && val != null && val !== '');
}


// Return object for specified person
function getPersonObject(person_id)
{
	var pObj = null, p_id;

	p_id = parseInt(person_id);
	if (!persons || !p_id)
		return null;

	persons.some(function(person)
	{
		if (person[0] == p_id)
			pObj = person;
		return (person[0] == p_id);
	});

	return pObj;
}


// Return name of person
function getPersonName(p_id)
{
	var person;

	person = getPersonObject(p_id);
	if (!person || !isArray(person) || person.length < 3)
		return null;

	return person[1];
}


// Return array of balance
function getPersonBalance(p_id)
{
	var person, resArr = [];

	person = getPersonObject(p_id);
	if (!person || !isArray(person) || person.length < 3 || !isArray(person[2]))
		return null;

	person[2].forEach(function(acc)
	{
		resArr.push(formatCurrency(acc[2], acc[1]));
	});

	return resArr;
}


// Return balance of current person in specified currency
function getCurPersonBalance(curr_id)
{
	var personid, p_id, person, resBal = 0.0;

	personid = ge('person_id');
	if (!personid || !curr_id)
		return resBal;
	person = getPersonObject(personid.value);
	if (!person || !isArray(person) || person.length < 3 || !isArray(person[2]))
		return resBal;

	// check person have account in specified currency
	person[2].some(function(acc)
	{
		if (acc[1] == curr_id)
			resBal = acc[2];

		return (acc[1] == curr_id);
	});

	return resBal;
}
