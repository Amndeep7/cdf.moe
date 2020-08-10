FROM ubuntu:20.04

WORKDIR /code

ENV PATH /code/node_modules/.bin:$PATH

RUN apt-get update \
  && apt-get install -y sudo curl git wget unzip python3 make g++ fontconfig fonts-symbola \
  && curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash - \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

ARG IOSEVKA_VERSION=3.2.2

RUN wget -O /code/iosevka_aile.zip "https://github.com/be5invis/Iosevka/releases/download/v${IOSEVKA_VERSION}/pkg-iosevka-aile-${IOSEVKA_VERSION}.zip" \
  && mkdir -p /code/src/assets/fonts/Iosevka_Aile \
  && unzip /code/iosevka_aile.zip -d /code/src/assets/fonts/Iosevka_Aile \
  && rm /code/iosevka_aile.zip

COPY package.json /code/

RUN npm install

CMD ["npm", "run", "serve"]
