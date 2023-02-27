up:
	docker-compose -p kiera up -d

up-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml -p kiera up --build -d

down: 
	docker-compose -f docker-compose.yml -p kiera down

rm:
	docker image rm kiera_bot

live-log:
	docker logs --follow "$(shell docker ps -a | grep "kiera-bot" | cut -d ' ' -f1)"
