<?php

namespace JezveMoney\Core;

// Type of messages
define("MSG_TYPE_NONE", 0);
define("MSG_TYPE_SUCCESS", 1);
define("MSG_TYPE_ERROR", 2);

class Message
{
    /**
     * Sets session message
     *
     * @param string $message - message string
     * @param int $msgType - message type
     *
     * @return bool
     */
    public static function set($message, $msgType = MSG_TYPE_NONE)
    {
        sessionStart();

        $_SESSION["msg"] = $message;
        $_SESSION["msgType"] = $msgType;

        return true;
    }

    /**
     * Sets successfull session message
     *
     * @param string $message - message string
     *
     * @return bool
     */
    public static function setSuccess($message)
    {
        return self::set($message, MSG_TYPE_SUCCESS);
    }

    /**
     * Sets error session message
     *
     * @param string $message - message string
     *
     * @return bool
     */
    public static function setError($message)
    {
        return self::set($message, MSG_TYPE_ERROR);
    }

    /**
     * Returns message data if available or null otherwise
     *
     * @return [array|null]
     */
    public static function check()
    {
        sessionStart();

        if (!isset($_SESSION["msg"]) || is_null($_SESSION["msg"])) {
            return null;
        }

        $msgType = intval($_SESSION["msgType"]);
        if ($msgType == MSG_TYPE_NONE) {
            $_SESSION["msg"] = null;
            return null;
        }

        $msgMessage = $_SESSION["msg"];

        $msgClass = "";
        if ($msgType == MSG_TYPE_SUCCESS) {
            $msgClass = "msg_success";
        } elseif ($msgType == MSG_TYPE_ERROR) {
            $msgClass = "msg_error";
        }

        $_SESSION["msg"] = null;

        $res = [
            "title" => $msgMessage,
            "type" => $msgClass,
        ];

        return $res;
    }
}
