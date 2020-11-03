<?php

namespace JezveMoney\Core;

    // Type of messages
    define("MSG_TYPE_NONE", 0);
    define("MSG_TYPE_SUCCESS", 1);
    define("MSG_TYPE_ERROR", 2);


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


define("MSG_NONE", 0);

define("MSG_REGISTER", 100);
define("ERR_REGISTER_FAIL", 101);
define("MSG_LOGIN", 102);
define("ERR_LOGIN_FAIL", 103);
define("MSG_PROFILE_NAME", 104);
define("ERR_PROFILE_NAME", 105);
define("MSG_PROFILE_PASSWORD", 106);
define("ERR_PROFILE_PASSWORD", 107);
define("MSG_PROFILE_RESETALL", 108);
define("ERR_PROFILE_RESETALL", 109);
define("MSG_PROFILE_DELETE", 110);
define("ERR_PROFILE_DELETE", 111);

define("MSG_USER_CREATE", 200);
define("ERR_USER_CREATE", 201);
define("MSG_USER_UPDATE", 202);
define("ERR_USER_UPDATE", 203);
define("MSG_USER_DELETE", 204);
define("ERR_USER_DELETE", 205);

define("MSG_ACCOUNT_CREATE", 300);
define("ERR_ACCOUNT_CREATE", 301);
define("MSG_ACCOUNT_UPDATE", 302);
define("ERR_ACCOUNT_UPDATE", 303);
define("MSG_ACCOUNT_SHOW", 304);
define("ERR_ACCOUNT_SHOW", 305);
define("MSG_ACCOUNT_HIDE", 306);
define("ERR_ACCOUNT_HIDE", 307);
define("MSG_ACCOUNT_DELETE", 308);
define("ERR_ACCOUNT_DELETE", 309);
define("MSG_ACCOUNTS_RESET", 310);
define("ERR_ACCOUNTS_RESET", 311);

define("MSG_CURRENCY_CREATE", 400);
define("ERR_CURRENCY_CREATE", 401);
define("MSG_CURRENCY_UPDATE", 402);
define("ERR_CURRENCY_UPDATE", 403);
define("MSG_CURRENCY_DELETE", 404);
define("ERR_CURRENCY_DELETE", 405);

define("MSG_PERSON_CREATE", 500);
define("ERR_PERSON_CREATE", 501);
define("ERR_PERSON_CREATE_EXIST", 502);
define("MSG_PERSON_UPDATE", 503);
define("ERR_PERSON_UPDATE", 504);
define("ERR_PERSON_UPDATE_EXIST", 505);
define("MSG_PERSON_SHOW", 506);
define("ERR_PERSON_SHOW", 507);
define("MSG_PERSON_HIDE", 508);
define("ERR_PERSON_HIDE", 509);
define("MSG_PERSON_DELETE", 510);
define("ERR_PERSON_DELETE", 511);

define("MSG_TRANS_CREATE", 600);
define("ERR_TRANS_CREATE", 601);
define("MSG_TRANS_UPDATE", 602);
define("ERR_TRANS_UPDATE", 603);
define("MSG_TRANS_DELETE", 604);
define("ERR_TRANS_DELETE", 605);

define("MSG_DEBT_CREATE", 700);
define("ERR_DEBT_CREATE", 701);
define("MSG_DEBT_UPDATE", 702);
define("ERR_DEBT_UPDATE", 703);

define("MSG_ICON_CREATE", 800);
define("ERR_ICON_CREATE", 801);
define("MSG_ICON_UPDATE", 902);
define("ERR_ICON_UPDATE", 903);
define("MSG_ICON_DELETE", 904);
define("ERR_ICON_DELETE", 905);


Message::add(MSG_REGISTER, MSG_TYPE_SUCCESS, "You successfully registered.");
Message::add(ERR_REGISTER_FAIL, MSG_TYPE_ERROR, "Fail to register.");
Message::add(MSG_LOGIN);
Message::add(ERR_LOGIN_FAIL, MSG_TYPE_ERROR, "Wrong login/password. Please check it and try to retype again.");
Message::add(MSG_PROFILE_NAME, MSG_TYPE_SUCCESS, "User name successfully updated.");
Message::add(ERR_PROFILE_NAME, MSG_TYPE_ERROR, "Fail to update user name.");
Message::add(MSG_PROFILE_PASSWORD, MSG_TYPE_SUCCESS, "Password successfully updated.");
Message::add(ERR_PROFILE_PASSWORD, MSG_TYPE_ERROR, "Fail to update password.");
Message::add(MSG_PROFILE_RESETALL, MSG_TYPE_SUCCESS, "All data successfully reseted.");
Message::add(ERR_PROFILE_RESETALL, MSG_TYPE_ERROR, "Fail to reset.");
Message::add(MSG_PROFILE_DELETE, MSG_TYPE_SUCCESS, "Your profile is successfully deleted.");
Message::add(ERR_PROFILE_DELETE, MSG_TYPE_ERROR, "Fail to delete profile.");

Message::add(MSG_USER_CREATE, MSG_TYPE_SUCCESS, "User successfully created.");
Message::add(ERR_USER_CREATE, MSG_TYPE_ERROR, "Fail to create user.");
Message::add(MSG_USER_UPDATE, MSG_TYPE_SUCCESS, "User successfully updated.");
Message::add(ERR_USER_UPDATE, MSG_TYPE_ERROR, "Fail to update user.");
Message::add(MSG_USER_DELETE, MSG_TYPE_SUCCESS, "User successfully deleted.");
Message::add(ERR_USER_DELETE, MSG_TYPE_ERROR, "Fail to delete user.");

Message::add(MSG_ACCOUNT_CREATE);
Message::add(ERR_ACCOUNT_CREATE, MSG_TYPE_ERROR, "Fail to create new account.");
Message::add(MSG_ACCOUNT_UPDATE);
Message::add(ERR_ACCOUNT_UPDATE, MSG_TYPE_ERROR, "Fail to update account.");
Message::add(MSG_ACCOUNT_SHOW);
Message::add(ERR_ACCOUNT_SHOW, MSG_TYPE_ERROR, "Fail to show account.");
Message::add(MSG_ACCOUNT_HIDE);
Message::add(ERR_ACCOUNT_HIDE, MSG_TYPE_ERROR, "Fail to hide account.");
Message::add(MSG_ACCOUNT_DELETE);
Message::add(ERR_ACCOUNT_DELETE, MSG_TYPE_ERROR, "Fail to delete account.");
Message::add(MSG_ACCOUNTS_RESET, MSG_TYPE_SUCCESS, "Accounts successfully reseted");
Message::add(ERR_ACCOUNTS_RESET, MSG_TYPE_ERROR, "Fail to reset.");

Message::add(MSG_CURRENCY_CREATE, MSG_TYPE_SUCCESS, "Currency successfully created.");
Message::add(ERR_CURRENCY_CREATE, MSG_TYPE_ERROR, "Fail to create new currency.");
Message::add(MSG_CURRENCY_UPDATE, MSG_TYPE_SUCCESS, "Currency successfully updated.");
Message::add(ERR_CURRENCY_UPDATE, MSG_TYPE_ERROR, "Fail to update currency.");
Message::add(MSG_CURRENCY_DELETE, MSG_TYPE_SUCCESS, "Currency successfully deleted.");
Message::add(ERR_CURRENCY_DELETE, MSG_TYPE_ERROR, "Fail to delete currency.");

Message::add(MSG_PERSON_CREATE);
Message::add(ERR_PERSON_CREATE, MSG_TYPE_ERROR, "Fail to create new person.");
Message::add(ERR_PERSON_CREATE_EXIST, MSG_TYPE_ERROR, "Fail to update person. Person with same name already exist.");
Message::add(MSG_PERSON_UPDATE);
Message::add(ERR_PERSON_UPDATE, MSG_TYPE_ERROR, "Fail to update person.");
Message::add(ERR_PERSON_UPDATE_EXIST, MSG_TYPE_ERROR, "Fail to update person. Person with same name already exist.");
Message::add(MSG_PERSON_SHOW);
Message::add(ERR_PERSON_SHOW, MSG_TYPE_ERROR, "Fail to show person.");
Message::add(MSG_PERSON_HIDE);
Message::add(ERR_PERSON_HIDE, MSG_TYPE_ERROR, "Fail to hide person.");
Message::add(MSG_PERSON_DELETE);
Message::add(ERR_PERSON_DELETE, MSG_TYPE_ERROR, "Fail to delete person.");

Message::add(MSG_TRANS_CREATE);
Message::add(ERR_TRANS_CREATE, MSG_TYPE_ERROR, "Fail to create new transaction.");
Message::add(MSG_TRANS_UPDATE);
Message::add(ERR_TRANS_UPDATE, MSG_TYPE_ERROR, "Fail to update transaction.");
Message::add(MSG_TRANS_DELETE);
Message::add(ERR_TRANS_DELETE, MSG_TYPE_ERROR, "Fail to delete transaction.");

Message::add(MSG_DEBT_CREATE);
Message::add(ERR_DEBT_CREATE, MSG_TYPE_ERROR, "Fail to create new debt.");
Message::add(MSG_DEBT_UPDATE);
Message::add(ERR_DEBT_UPDATE, MSG_TYPE_ERROR, "Fail to update debt.");

Message::add(MSG_ICON_CREATE, MSG_TYPE_SUCCESS, "Icon successfully created.");
Message::add(ERR_ICON_CREATE, MSG_TYPE_ERROR, "Fail to create new icon.");
Message::add(MSG_ICON_UPDATE, MSG_TYPE_SUCCESS, "Icon successfully updated.");
Message::add(ERR_ICON_UPDATE, MSG_TYPE_ERROR, "Fail to update icon.");
Message::add(MSG_ICON_DELETE, MSG_TYPE_SUCCESS, "Icon successfully deleted.");
Message::add(ERR_ICON_DELETE, MSG_TYPE_ERROR, "Fail to delete icon.");
