<?php

namespace JezveMoney\Core;


class JSON
{
	public static function decode($jsonData, $asArray = FALSE, $depth = 512)
	{
		if (is_null($jsonData) || $jsonData == "")
			return NULL;

		$fdata = rawurldecode($jsonData);

		if (PHP_VERSION_ID >= 70300)
		{
			$decodedData = json_decode($fdata, $asArray, $depth, JSON_THROW_ON_ERROR);
		}
		else
		{
			$decodedData = json_decode($fdata, $asArray, $depth);
			$js_err = json_last_error();
			if ($js_err != JSON_ERROR_NONE)
				throw new \Exception(json_last_error_msg());
		}

		return $decodedData;
	}


	// Fixed json_encode function
	public static function encode($obj)
	{
		if (PHP_VERSION_ID >= 50400)
		{
			return json_encode($obj, JSON_UNESCAPED_UNICODE);
		}
		else
		{
			return preg_replace_callback('/((\\\u[01-9a-fA-F]{4})+)/',
					function($matches)
					{
						return json_decode('"'.$matches[1].'"');
					},
					json_encode($obj));
		}
	}
}
