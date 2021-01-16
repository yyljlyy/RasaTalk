FROM node:10-slim

RUN echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ stretch main contrib non-free" > /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ stretch-updates main contrib non-free" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ stretch-backports main contrib non-free" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian-security/ stretch/updates main contrib non-free" >> /etc/apt/sources.list

RUN apt-get update && apt-get install build-essential libpng12-0 libpng-dev bzip2 -y

# Create app directory
WORKDIR /usr/src/app

COPY . .

RUN yarn config set registry https://registry.npm.taobao.org/

RUN npm install -g cnpm --registry=https://registry.npm.taobao.org

RUN yarn install

RUN yarn build

CMD ["yarn", "start:prod"]
