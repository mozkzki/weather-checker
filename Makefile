.PHONY: test layer start

test:
	npm run test

layer:
	./lambda/layer/chrome/createLayer.sh

start:
	aws lambda invoke --no-cli-auto-prompt --function-name weather-checker response.json --log-type Tail --query 'LogResult' --output text | base64 -d
