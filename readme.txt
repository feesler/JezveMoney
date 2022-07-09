- Environment setup to run PHP from shell:

1. Add following to PATH:
    "$phpPath\ext"
    "$phpPath\pear"
    "$phpPath\pear\bin"
    "$phpPath"
    "$osPanelPath\modules\wget\bin"
    "$osPanelPath\modules\database\MariaDB-10.4\bin"
    "$osPanelPath\modules\http\Apache_2.4-PHP_7.2-7.4\bin"
    "$osPanelPath\modules\http\Apache_2.4-PHP_7.2-7.4"
2. Add environment variables:
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

Ex.: $osPanelPath = "c:\ospanel"
$phpPath = "$osPanelPath\modules\php\PHP_7.4"

- HTTPS setup with OpenServer
1. Generate certificates
2. Run PowerShell as Administrator and open generated DOMAIN-rootCA.crt
3. Install Certificate > Current User > Trusted Root Certification Authorities > Local Computer
4. Edit userdata\config\Apache_2.4-PHP_8.0_vhost.conf file:
    SSLCertificateFile          "%sprogdir%/userdata/config/cert_files/testsrv/testsrv.pem"
    SSLCertificateKeyFile       "%sprogdir%/userdata/config/cert_files/testsrv/testsrv-key.pem"


- PowerShell browserify access rights issue:

1. Run powershell as Administrator
2. Run command:
	Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
3. Check result by running command
	Get-ExecutionPolicy -List


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
Run from app root:
.\dev-tools\vendor\bin\phan

PHP Code Sniffer
Run from app root:
.\dev-tools\vendor\bin\phpcs --standard=PSR12 <files to check>
.\dev-tools\vendor\bin\phpcbf --standard=PSR12 <files to fix>

PHP CS Fixer
.\dev-tools\vendor\bin\php-cs-fixer fix --rules=@PSR2 <files to fix>
