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
ENV PORT $PORT
<<<<<<< HEAD
CMD node dist/insight_server.js $PORT
=======
CMD ["node", "dist/insight_server.js", "$PORT"]
>>>>>>> 6dfda0387950188f938cbb8baf500881930e0caf
