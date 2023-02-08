<?php

namespace JezveMoney\Core;

// Type of messages
define("MSG_TYPE_NONE", 0);
define("MSG_TYPE_SUCCESS", 1);
define("MSG_TYPE_ERROR", 2);

/**
 * Session message class
 */
class Message
{
    /**
     * Sets session message
     *
     * @param string $message message string
     * @param int $msgType message type
     *
     * @return bool
     */
    public static function set(string $message, int $msgType = MSG_TYPE_NONE)
    {
        sessionStart();

        $_SESSION["msg"] = $message;
        $_SESSION["msgType"] = $msgType;

        return true;
    }

    /**
     * Sets successfull session message
     *
     * @param string $message message string
     *
     * @return bool
     */
    public static function setSuccess(string $message)
    {
        return self::set($message, MSG_TYPE_SUCCESS);
    }

    /**
     * Sets error session message
     *
     * @param string $message message string
     *
     * @return bool
     */
    public static function setError(string $message)
    {
        return self::set($message, MSG_TYPE_ERROR);
    }

    /**
     * Returns message data if available or null otherwise
     *
     * @return array|null
     */
    public static function check()
    {
        sessionStart();

        $msgType = isset($_SESSION["msgType"]) ? intval($_SESSION["msgType"]) : MSG_TYPE_NONE;
        $message = $_SESSION["msg"] ?? null;

        $_SESSION["msg"] = null;

        if (
            ($msgType !== MSG_TYPE_SUCCESS && $msgType !== MSG_TYPE_ERROR)
            || is_empty($message)
        ) {
            return null;
        }

        $res = [
            "title" => $message,
            "type" => ($msgType === MSG_TYPE_SUCCESS) ? "success" : "error",
        ];

        return $res;
    }
}
