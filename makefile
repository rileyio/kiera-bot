s:
	eval ./scripts/manage

up:
	podman compose -p kiera up -d --build

up-prod:
	podman-compose -f docker-compose.yml -f docker-compose.prod.yml -p kiera up --build -d

down:
	podman stop "$(shell podman ps -a | grep "kiera-bot" | cut -d ' ' -f1)"

start:
	podman start "$(shell podman container list -a | grep "kiera-bot" | cut -d ' ' -f1)"

stop:
	podman stop "$(shell podman ps -a | grep "kiera-bot" | cut -d ' ' -f1)"

restart:
	podman restart "$(shell podman ps -a | grep "kiera-bot" | cut -d ' ' -f1)"

rm:
	podman rm "$(shell podman ps -a | grep "kiera-bot" | cut -d ' ' -f1)"

live-log:
	podman logs --follow "$(shell podman ps -a | grep "kiera-bot" | cut -d ' ' -f1)"
