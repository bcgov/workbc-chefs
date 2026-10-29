FROM artifacts.developer.gov.bc.ca/docker-remote/node:24.21.0-alpine

ENV NO_UPDATE_NOTIFIER=true

RUN apk add --no-cache openssl curl \
    && apk add --no-cache --virtual .build-deps python3 make g++

WORKDIR /opt/app-root/src/app
COPY . /opt/app-root/src
RUN npm run all:ci \
  && npm run all:build \
  && npm run frontend:purge \
  && npm run components:clean \
  && npm run components:purge \
  && apk del .build-deps
EXPOSE 8000
CMD ["npm", "run", "start"]
