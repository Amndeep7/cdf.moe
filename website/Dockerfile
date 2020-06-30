FROM node:14.0.0-alpine

WORKDIR /code

ENV PATH /code/node_modules/.bin:$PATH

RUN apk update && apk add --no-cache git

COPY package.json /code/

RUN npm install

CMD ["npm", "run", "serve"]
