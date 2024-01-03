<?php

/**
 * Returns salt for specified string
 *
 * @param string $str source string
 *
 * @return string
 */
function getSalt(string $str)
{
    $bfPrefix = "\$2y\$10\$";

    return $bfPrefix . substr(md5($str), 0, 20) . "..";
}

/**
 * Returns hash for specified string and salt
 *
 * @param string $str source string
 * @param string $salt salt
 *
 * @return string
 */
function getHash(string $str, string $salt)
{
    return substr(crypt($str, $salt), 28);
}

/**
 * Checks correctness of hash
 *
 * @param string $str source string
 * @param string $salt salt
 * @param string $hash hash to test
 *
 * @return bool
 */
function checkHash(string $str, string $salt, string $hash)
{
    $full_hash = substr($salt, 0, 28) . $hash;

    return (crypt($str, $salt) == $full_hash);
}

/**
 * Creates pre hash for login/password pair
 *
 * @param string $login login string
 * @param string $password password string
 *
 * @return string
 */
function createPreHash(string $login, string $password)
{
    $salt = getSalt($login);
    return getHash($password, $salt);
}

/**
 * Creates hash for login/password pair
 *
 * @param string $login login string
 * @param string $password password string
 *
 * @return string
 */
function createHash(string $login, string $password)
{
    $salt = getSalt($login);
    $hashed = getHash($password, $salt);

    return getHash($hashed, $salt);
}
