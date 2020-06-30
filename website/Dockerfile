FROM node:14.0.0-alpine

WORKDIR /code

ENV PATH /code/node_modules/.bin:$PATH

RUN apk update && apk add --no-cache git wget bash

ARG IOSEVKA_VERSION=3.2.2

RUN wget -O /code/iosevka_aile.zip "https://github.com/be5invis/Iosevka/releases/download/v${IOSEVKA_VERSION}/pkg-iosevka-aile-${IOSEVKA_VERSION}.zip" \
  && mkdir -p /code/src/assets/fonts/Iosevka_Aile \
  && unzip /code/iosevka_aile.zip -d /code/src/assets/fonts/Iosevka_Aile \
  && rm /code/iosevka_aile.zip

COPY package.json /code/

RUN npm install

CMD ["npm", "run", "serve"]
