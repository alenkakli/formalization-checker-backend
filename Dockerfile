FROM buildpack-deps:bullseye as vampire-build

RUN set -ex; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        cmake \
    ; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src

RUN git clone --branch v4.6.1.sl https://github.com/vprover/vampire.git

WORKDIR /usr/src/vampire-build

RUN set -ex; \
    cmake ../vampire; \
    make -j 4; \
    cd bin; \
    cp -a vampire_* vampire

FROM node:latest

WORKDIR /usr/local/bin

COPY --from=vampire-build /usr/src/vampire-build/bin/vampire .

ENV PATH_TO_VAMPIRE=/usr/local/bin/vampire

WORKDIR /usr/src

RUN set -ex; \
    git clone --branch tptp https://github.com/nikolakulikova/js-fol-parser.git

RUN set -ex; \
    cd js-fol-parser; \
    npm install; \
    npm run build; \
    npm prune --production

WORKDIR /usr/src/formalization-checker-backend

COPY . .

RUN set -ex; \
    npm install

EXPOSE 3000

CMD [ "npm", "run", "start" ]
