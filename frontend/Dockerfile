
# Build step
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* ./
RUN if [ -f package-lock.json ]; then npm install; \
    elif [ -f yarn.lock ]; then yarn install; \
    else npm install; fi
COPY . .
RUN npm run build

# Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
