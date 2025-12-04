FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* ./

RUN if [ -f package-lock.json ]; then npm install; \
    elif [ -f yarn.lock ]; then yarn install; \
    else npm install; fi

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]


