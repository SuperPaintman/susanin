FROM node:6.9.2

MAINTAINER SuperPaintman <SuperPaintmanDeveloper@gmail.com>

# Env
ENV NODE_ENV="production" \
    NODE_APP_PATH="/app" \
    NODE_PORT="3000" \
    YARN_VERSION="0.17.10"

# Workdir
WORKDIR "${NODE_APP_PATH}"

# Exposing port
EXPOSE "${NODE_PORT}"

# Yarn
RUN npm install -g "yarn@${YARN_VERSION}"

# Install deps
COPY ./package.json "${NODE_APP_PATH}/package.json"

RUN (NODE_ENV=development \
    && yarn install --ignore-scripts --no-progress \
    && yarn ls)

# Copy code
ADD . "${NODE_APP_PATH}"

RUN npm run build:clear \
    && npm run build:images \
    && npm run build:icons \
    && npm run build:server \
    && (NODE_ENV=development && npm run build:client)

COPY manifest-css.json manifest-js.json "${NODE_APP_PATH}/"

# Remove extra deps
RUN yarn install --production --ignore-scripts --no-progress \
    && yarn ls
    && export PATH="$(npm bin):${PATH}"

# Volumes
VOLUME ["/app/certs", "/app/logs"]

# Entrypoint
COPY ./docker-entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

CMD ["npm", "start"]