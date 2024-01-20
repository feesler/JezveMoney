- Install and setup OSPanel 6

 1. Download OpenServer installation binary: https://github.com/OSPanel/OpenServerPanel/releases
 2. Install program and reboot Windows
 3. Run OpenServer
 4. Open console and run:
    osp init PHP-8.3
    osp on PHP-8.3
    osp use PHP-8.3
    osp on MariaDB-11.2
    osp add MariaDB-11.2

 5. Add domain configuration to C:\OSPanel\config\domains.ini:
    [testsrv]

    aliases              = testsrv
    auto_configure       = on
    enabled              = on
    engine               = PHP-8.3
    ip                   = auto
    log_format           = combined
    cgi_dir              = {root_dir}\home\{host}\cgi-bin
    public_dir           = {root_dir}\home\{host}\www
    ssl                  = on
    ssl_auto_cert        = on
    ssl_cert_file        = {root_dir}\data\ssl\domains\{host}\cert.crt
    ssl_key_file         = {root_dir}\data\ssl\domains\{host}\cert.key
    project_add_commands =
    project_add_modules  =
    project_home_dir     =
    project_use_sys_env  = off
    terminal_codepage    =

 7. Run cmd.exe as Administrator and navigate to project directory
 6. Create directory for domain at C:\OSPanel\home:
    mkdir C:\OSPanel\home\testsrv
 8. Create symbolic link www for real domain directory:
    mklink /D C:\OSPanel\home\testsrv\www <full project path>\dist

 9. Update PHP configuration at C:\OSPanel\config\PHP-8.3\default\templates\php.ini
    1) Enable AST extension:
    extension                      = ast

10. Setup Windows environment to run PHP from shell:
    1) Add following to PATH:
    "$phpPath\ext"
    "$phpPath\pear"
    "$phpPath\pear\bin"
    "$phpPath"
    "$osPanelPath\modules\MariaDB-11.2\bin"
    "$osPanelPath\modules\PHP-8.3\Apache\bin"
    "$osPanelPath\modules\PHP-8.3\Apache"

    2) Add environment variables:
    PHP_BIN = "$phpPath\php.exe"
    PHP_BINARY = "$phpPath\php.exe"
    PHP_BINDIR = "$phpPath\"
    PHP_DIR = "$phpPath\"
    PHP_INI = "$phpPath\php.ini"
    PHP_PEAR_BIN_DIR = "$phpPath\PEAR"
    PHP_PEAR_DATA_DIR = "$phpPath\PEAR\data"
    PHP_PEAR_DOC_DIR = "$phpPath\PEAR\docs"
    PHP_PEAR_INSTALL_DIR = "$phpPath\PEAR\pear"
    PHP_PEAR_PHP_BIN = "$phpPath\php.exe"
    PHP_PEAR_SYSCONF_DIR = "$phpPath\PEAR"
    PHP_PEAR_TEST_DIR = "$phpPath\PEAR\tests"
    PHPBIN = "$phpPath\php.exe"
    PHPDIR = "$phpPath\"
    PHPRC = "$phpPath"

Ex.: $osPanelPath = "C:\OSPanel"
$phpPath = "$osPanelPath\modules\PHP-8.3\PHP"

11. Reboot Windows


- Install and setup phpMyAdmin with MariaDB on OSPanel 6

1. Download phpMyAdmin release from official site: https://www.phpmyadmin.net/downloads/
2. Add domain configuration for phpmyadmin
3. Extract downloaded archive to domain directory. Ex.: C:\OSPanel\home\phpmyadmin\www
4. Go to phpmyadmin domain directory
5. Copy config.sample.inc.php to config.inc.php
6. Check MariaDB server settings at C:\OSPanel\config\MariaDB-10.6\default\settings.ini
   To use 'localhost' server set following
   [main]
   ip = 127.0.0.1

6. Set following values at config.inc.php:
    $cfg['Servers'][$i]['host'] = 'localhost';
    $cfg['Servers'][$i]['user'] = 'root';
    $cfg['Servers'][$i]['AllowNoPassword'] = true;


- HTTPS setup with OpenServer 5

1. Download mkcert https://github.com/FiloSottile/mkcert/releases
2. mkcert -install
3. mkcert testsrv
4. Copy testsrv.pem and testsrv-key.pem to $osPanelPath/userdata/config/cert_files/testsrv/
5. Make copy testsrv.pem of as testsrv.crt and open it
6. Install Certificate > Current User > Trusted Root Certification Authorities > Local Computer
7. Create directory for domain: $osPanelPath/domains/testsrv
8. Create symbolic link www for real domain directory:
    mklink /D $osPanelPath\domains\testsrv\www <domain directory>
9. Copy $osPanelPath\userdata\config\Apache_2.4-PHP_8.0_vhost.conf to domain directory
10. Edit Apache_2.4-PHP_8.0_vhost.conf file:
    DocumentRoot    "%hostdir%/www"

    SSLCertificateFile          "%sprogdir%/userdata/config/cert_files/testsrv/testsrv.pem"
    SSLCertificateKeyFile       "%sprogdir%/userdata/config/cert_files/testsrv/testsrv-key.pem"
11. Allow symlinks in apache config:
   1) Open $osPanelPath\userdata\config\Apache_2.4-PHP_8.0_server.conf
   2) Go to <Directory />
   3) Change -FollowSymLinks option to +FollowSymLinks


- PowerShell access rights issue:

1. Run powershell as Administrator
2. Run command:
	Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
3. Check result by running command
	Get-ExecutionPolicy -List


- Debug server side PHP code in VSCode:

1. Install xDebug extension for PHP
2. Update PHP.ini:
2.1 Enable xDebug extension
    zend_extension = xdebug
3. Update settings
    ;xdebug.mode = off
    xdebug.mode = debug,trace
    xdebug.start_with_request = yes
4. Install "PHP Debug" extension for VSCode
5. Go to "Run and Debug" tab of Activity bar
6. Go to settings (open launch.json file)
7. From drop down menu near to "Start Debugging" button select "Add Configuration..."
8. Select "PHP: Listen for XDebug" configuration item at opened menu
9. New configuration object will be added to launch.json file:
    {
        "name": "Listen for Xdebug",
        "type": "php",
        "request": "launch",
        "port": 9003
    },
10. Check "port" property is the same as "xdebug.client_port" at PHP.ini
    xdebug.client_port = 9003
11. Restart server
12. Launch "Listen for XDebug" from "Run and Debug" tab


- WebGrind profiler:

1. In PHP.ini set
	xdebug.profiler_enable = 1
2. To see profiler results open URL:
	http://localhost:8096/webgrind/


- Find in project:
	grep -srn  --exclude-dir={vendor,node_modules} " request " ./


- Update Node.js packages:
	npm update

- Update composer packages
    npm run update-composer

- Phan
- Install php-ast extension
1. Download latest release from https://windows.php.net/downloads/pecl/releases/ast/
2. Copy php_ast.dll to $osPanelPath/modules/php/PHP_8.0/ext
3. Add to $osPanelPath/userdata/config/PHP_8.0_php.ini fololowing line:
extension=php_ast.dll
4. Restart server

Run from app root:
.\dev-tools\vendor\bin\phan

PHP Code Sniffer
Run from app root:
.\dev-tools\vendor\bin\phpcs --standard=PSR12 <files to check>
.\dev-tools\vendor\bin\phpcbf --standard=PSR12 <files to fix>

PHP CS Fixer
.\dev-tools\vendor\bin\php-cs-fixer fix --rules=@PSR2 <files to fix>

Run tests in browser
Run browser with --disable-ipc-flooding-protection flag