PowerShell browserify access rights issue:

1. Run powershell as Administrator
2. Run command:
	Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
3. Check result by running command
	Get-ExecutionPolicy -List


WebGrind profiler:

1. In PHP.ini set
	xdebug.profiler_enable = 1
2. To see profiler results open URL:
	http://localhost:8096/webgrind/


Find in project:
	grep -srn  --exclude-dir={vendor,node_modules} " request " ./


Update Node.js packages:
	npm update

Composer
Update packages:
	composer update
Optimize autoload:
	composer dump-autoload -a


Phan
Run from app root:
.\src\vendor\bin\phan