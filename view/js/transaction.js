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
