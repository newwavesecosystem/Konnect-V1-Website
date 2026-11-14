FROM node:22-alpine  as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG REACT_APP_REGISTER_URL=${REACT_APP_REGISTER_URL}
ARG REACT_APP_LOGIN_URL=${REACT_APP_LOGIN_URL}
ARG REACT_APP_PUBLIC_API_BASE_URL=${REACT_APP_PUBLIC_API_BASE_URL}

RUN npm run build

# production environment
FROM nginx:1.13.9-alpine
RUN rm -rf /etc/nginx/conf.d
RUN mkdir -p /etc/nginx/conf.d
COPY ./default.conf /etc/nginx/conf.d/
COPY --from=builder /app/build/ /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
