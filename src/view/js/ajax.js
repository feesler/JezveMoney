var ajax = new (function()
{
    // Create AJAX object
    function createRequestObject()
    {
        try
        {
            return new XMLHttpRequest();
        }
        catch(e)
        {
            try
            {
                return new ActiveXObject('Msxml2.XMLHTTP');
            }
            catch(e)
            {
                try
                {
                    return new ActiveXObject('Microsoft.XMLHTTP');
                }
                catch(e)
                {
                    return null;
                }
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


    function getHeader(headers, name)
    {
        if (!headers || !name)
            return null;

        var lname = name.toLowerCase();
        for(var header in headers)
        {
            if (lname == header.toLowerCase())
                return headers[header];
        }

        return null;
    }


    // Make asynchronous request
    function sendRequest(options)
    {
        if (!options || !options.url)
            return false;

        var supportedMethods = ['get', 'head', 'post', 'put', 'delete', 'options'];
        var http = createRequestObject();

        if (!http)
            return false;

        var method = options.method.toLowerCase();
        if (supportedMethods.indexOf(method) == -1)
            return false;

        http.open(method, options.url, true);
        if (options.headers)
        {
            for(var header in options.headers)
            {
                http.setRequestHeader(header, options.headers[header]);
            }
        }

        if (method == 'post')
        {
            var contentType = getHeader(options.headers, 'Content-Type');
            if (!contentType)
                http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }

        if (isFunction(options.callback))
            http.onreadystatechange = onStateChange.bind(http, options.callback);

        var data = ('data' in options) ? options.data : null;
        http.send(data);
    }


// ajax global object public methods
    this.get = function(options)
    {
        if (!options || !options.url)
            return false;

        var request = copyObject(options);
        request.method = 'get';
        request.data = null;

        return sendRequest(request);
    }

    this.post = function(options)
    {
        if (!options || !options.url)
            return false;

        var request = copyObject(options);
        request.method = 'post';

        return sendRequest(request);
    }
})();
