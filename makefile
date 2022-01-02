up:
	docker-compose -p kiera up -d

up-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml -p kiera up --build -d

down: 
	docker-compose -f docker-compose.yml -p kiera down

rm:
	docker image rm kiera_bot