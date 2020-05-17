FROM library/node:latest

COPY ./package.json /tuya2mqtt/
COPY ./*.js /tuya2mqtt/

WORKDIR /tuya2mqtt

RUN npm install

CMD ["npm", "run-script", "run"]
