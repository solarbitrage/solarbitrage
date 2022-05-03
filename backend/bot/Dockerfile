# Only for production use!

FROM node:16
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci

COPY ".env" ./
COPY src/ src/
RUN rm src/common
RUN mkdir src/common
COPY .env src/common/.env
COPY dist dist/
EXPOSE 4000
CMD ["node", "dist/insight_server.js"]