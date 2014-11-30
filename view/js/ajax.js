// Create AJAX object
function createRequestObject()
{
	try { return new XMLHttpRequest() }
	catch(e)
	{
		try { return new ActiveXObject('Msxml2.XMLHTTP') }
		catch(e)
		{
			try { return new ActiveXObject('Microsoft.XMLHTTP') }
			catch(e) { return null; }
		}
	}
}


// Make asinchronous GET request by specified link and call callback function on ready
function getData(link, callback)
{
	var http = createRequestObject();
	if (http)
	{
		http.open('get', link, true);
		http.onreadystatechange = function()
		{
			if (http.readyState == 4)
			{
				if (callback)
					callback(http.responseText);
			}
		}
		http.send(null);
	}
}


// Make asinchronous POST request by specified link with parameters and call callback function on ready
// Params should be specified as string param1=value1&param2=value2&...&paramN=valueN
function postData(link, params, callback)
{
	var http = createRequestObject();
	if (http)
	{
		http.open('post', link, true);
		http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		http.onreadystatechange = function()
		{
			if (http.readyState == 4)
			{
				if (callback)
					callback(http.responseText);
			}
		}
		http.send(params);
	}
}

