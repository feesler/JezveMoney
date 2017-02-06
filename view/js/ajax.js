var ajax = new (function()
{
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


	// Request ready status change event handler
	function onStateChange(callback)
	{
		if (this.readyState == 4)
		{
			if (callback)
				callback(this.responseText);
		}
	}


	// Make asynchronous request
	function sendRequest(method, link, params, callback)
	{
		var supportedMethods = ['get', 'head', 'post', 'put', 'delete', 'options'];
		var http = createRequestObject();

		if (!http)
			return false;

		method = method.toLowerCase();
		if (supportedMethods.indexOf(method) == -1)
			return false;

		http.open(method, link, true);
		if (method == 'post')
			http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

		http.onreadystatechange = onStateChange.bind(http, callback);

		http.send(params);
	}


// ajax global object public methods
	this.get = function(link, callback)
	{
		return sendRequest('get', link, null, callback);
	}

	this.post = function(link, params, callback)
	{
		return sendRequest('post', link, params, callback);
	}
})();
