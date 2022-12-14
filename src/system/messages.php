<?php

namespace JezveMoney\Core;

Message::add(ERR_INVALID_REQUEST, MSG_TYPE_ERROR, "Invalid type of request");
Message::add(ERR_INVALID_REQUEST_DATA, MSG_TYPE_ERROR, "Invalid request data");
Message::add(ERR_NO_IDS, MSG_TYPE_ERROR, "No ids specified");

Message::add(MSG_REGISTER, MSG_TYPE_SUCCESS, "You successfully registered.");
Message::add(ERR_REGISTER_FAIL, MSG_TYPE_ERROR, "Fail to register.");
Message::add(MSG_LOGIN);
Message::add(ERR_LOGIN_FAIL, MSG_TYPE_ERROR, "Wrong login/password. Please check it and try to retype again.");
Message::add(MSG_PROFILE_NAME, MSG_TYPE_SUCCESS, "User name successfully updated.");
Message::add(ERR_PROFILE_NAME, MSG_TYPE_ERROR, "Fail to update user name.");
Message::add(MSG_PROFILE_PASSWORD, MSG_TYPE_SUCCESS, "Password successfully updated.");
Message::add(ERR_PROFILE_PASSWORD, MSG_TYPE_ERROR, "Fail to update password.");
Message::add(MSG_PROFILE_RESET, MSG_TYPE_SUCCESS, "Data successfully reseted.");
Message::add(ERR_PROFILE_RESET, MSG_TYPE_ERROR, "Fail to reset.");
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
Message::add(MSG_TRANS_CHANGE_POS);
Message::add(ERR_TRANS_CHANGE_POS, MSG_TYPE_ERROR, "Fail to change position of transaction.");
Message::add(MSG_TRANS_SET_CATEGORY);
Message::add(ERR_TRANS_SET_CATEGORY, MSG_TYPE_ERROR, "Fail to set category of transaction(s).");

Message::add(MSG_ICON_CREATE, MSG_TYPE_SUCCESS, "Icon successfully created.");
Message::add(ERR_ICON_CREATE, MSG_TYPE_ERROR, "Fail to create new icon.");
Message::add(MSG_ICON_UPDATE, MSG_TYPE_SUCCESS, "Icon successfully updated.");
Message::add(ERR_ICON_UPDATE, MSG_TYPE_ERROR, "Fail to update icon.");
Message::add(MSG_ICON_DELETE, MSG_TYPE_SUCCESS, "Icon successfully deleted.");
Message::add(ERR_ICON_DELETE, MSG_TYPE_ERROR, "Fail to delete icon.");

Message::add(MSG_IMPTPL_CREATE, MSG_TYPE_SUCCESS, "Import template successfully created.");
Message::add(ERR_IMPTPL_CREATE, MSG_TYPE_ERROR, "Fail to create new import template.");
Message::add(MSG_IMPTPL_UPDATE, MSG_TYPE_SUCCESS, "Import template successfully updated.");
Message::add(ERR_IMPTPL_UPDATE, MSG_TYPE_ERROR, "Fail to update import template.");
Message::add(MSG_IMPTPL_DELETE, MSG_TYPE_SUCCESS, "Import template successfully deleted.");
Message::add(ERR_IMPTPL_DELETE, MSG_TYPE_ERROR, "Fail to delete import template.");

Message::add(MSG_IMPORT_RULE_CREATE, MSG_TYPE_SUCCESS, "Import rule successfully created.");
Message::add(ERR_IMPORT_RULE_CREATE, MSG_TYPE_ERROR, "Fail to create new import rule.");
Message::add(MSG_IMPORT_RULE_UPDATE, MSG_TYPE_SUCCESS, "Import rule successfully updated.");
Message::add(ERR_IMPORT_RULE_UPDATE, MSG_TYPE_ERROR, "Fail to update import rule.");
Message::add(MSG_IMPORT_RULE_DELETE, MSG_TYPE_SUCCESS, "Import rule successfully deleted.");
Message::add(ERR_IMPORT_RULE_DELETE, MSG_TYPE_ERROR, "Fail to delete import rule.");

Message::add(MSG_IMPORT_ACT_CREATE, MSG_TYPE_SUCCESS, "Import action successfully created.");
Message::add(ERR_IMPORT_ACT_CREATE, MSG_TYPE_ERROR, "Fail to create new import action.");
Message::add(MSG_IMPORT_ACT_UPDATE, MSG_TYPE_SUCCESS, "Import action successfully updated.");
Message::add(ERR_IMPORT_ACT_UPDATE, MSG_TYPE_ERROR, "Fail to update import action.");
Message::add(MSG_IMPORT_ACT_DELETE, MSG_TYPE_SUCCESS, "Import action successfully deleted.");
Message::add(ERR_IMPORT_ACT_DELETE, MSG_TYPE_ERROR, "Fail to delete import action.");

Message::add(MSG_IMPORT_COND_CREATE, MSG_TYPE_SUCCESS, "Import condition successfully created.");
Message::add(ERR_IMPORT_COND_CREATE, MSG_TYPE_ERROR, "Fail to create new import condition.");
Message::add(MSG_IMPORT_COND_UPDATE, MSG_TYPE_SUCCESS, "Import condition successfully updated.");
Message::add(ERR_IMPORT_COND_UPDATE, MSG_TYPE_ERROR, "Fail to update import condition.");
Message::add(MSG_IMPORT_COND_DELETE, MSG_TYPE_SUCCESS, "Import condition successfully deleted.");
Message::add(ERR_IMPORT_COND_DELETE, MSG_TYPE_ERROR, "Fail to delete import condition.");

Message::add(MSG_CATEGORY_CREATE, MSG_TYPE_SUCCESS, "Category successfully created.");
Message::add(ERR_CATEGORY_CREATE, MSG_TYPE_ERROR, "Fail to create new category.");
Message::add(MSG_CATEGORY_UPDATE, MSG_TYPE_SUCCESS, "Category successfully updated.");
Message::add(ERR_CATEGORY_UPDATE, MSG_TYPE_ERROR, "Fail to update category.");
Message::add(MSG_CATEGORY_DELETE, MSG_TYPE_SUCCESS, "Category successfully deleted.");
Message::add(ERR_CATEGORY_DELETE, MSG_TYPE_ERROR, "Fail to delete category.");
