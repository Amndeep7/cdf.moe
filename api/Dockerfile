FROM node:14.0.0-alpine

WORKDIR /code

ENV PATH /code/node_modules/.bin:$PATH

ENV DEBUG server:*

COPY package.json /code/

RUN npm install

CMD ["npm", "run", "dev"]
