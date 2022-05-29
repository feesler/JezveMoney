<?php

namespace JezveMoney\Core;

// Type of messages
define("MSG_TYPE_NONE", 0);
define("MSG_TYPE_SUCCESS", 1);
define("MSG_TYPE_ERROR", 2);
// No message
define("MSG_NONE", 0);

class Message
{
    private static $msgArray = [];


    // Define new message constant
    public static function add($message_id, $msgType = MSG_TYPE_NONE, $message = null)
    {
        if ($msgType != MSG_TYPE_NONE && !is_null($message)) {
            self::$msgArray[$message_id] = [$msgType, $message];
        } else {
            self::$msgArray[$message_id] = [MSG_TYPE_NONE];
        }
    }


    // Try to set message
    public static function set($msg_id)
    {
        sessionStart();

        if (!isset(self::$msgArray[$msg_id])) {
            return false;
        }

        $_SESSION["msg"] = $msg_id;

        return true;
    }


    // Return message string by id
    public static function get($msg_id)
    {
        if (!isset(self::$msgArray[$msg_id])) {
            return null;
        }

        $msgParam = self::$msgArray[$msg_id];
        $msgMessage = $msgParam[1];

        return $msgMessage;
    }


    // Check message is set
    public static function isSet()
    {
        sessionStart();

        if (!isset($_SESSION["msg"])) {
            return false;
        }

        $msg_id = intval($_SESSION["msg"]);
        if ($msg_id == MSG_NONE || !isset(self::$msgArray[$msg_id])) {
            return false;
        }

        $msgParam = self::$msgArray[$msg_id];
        $msgType = $msgParam[0];
        if ($msgType == MSG_TYPE_NONE) {
            return false;
        }

        return true;
    }


    // Check message and show it if available
    public static function check()
    {
        sessionStart();

        if (!isset($_SESSION["msg"])) {
            return;
        }

        $msg_id = intval($_SESSION["msg"]);
        if ($msg_id == MSG_NONE || !isset(self::$msgArray[$msg_id])) {
            return;
        }

        $msgParam = self::$msgArray[$msg_id];
        $msgType = $msgParam[0];
        if ($msgType == MSG_TYPE_NONE) {
            $_SESSION["msg"] = MSG_NONE;
            return;
        }

        $msgMessage = $msgParam[1];

        $msgClass = "";
        if ($msgType == MSG_TYPE_SUCCESS) {
            $msgClass = "msg_success";
        } elseif ($msgType == MSG_TYPE_ERROR) {
            $msgClass = "msg_error";
        }

        include(TPL_PATH . "message.tpl");

        $_SESSION["msg"] = MSG_NONE;
    }
}
