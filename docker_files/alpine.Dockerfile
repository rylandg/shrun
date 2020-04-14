FROM alpine:3.11

RUN apk update && apk add curl git sudo bash tini
RUN apk add --update npm

ARG CLICOMMAND_ARG='usercli'
ENV CLICOMMAND=$CLICOMMAND_ARG
ENTRYPOINT ["/sbin/tini", "--"]

RUN addgroup -S dockeruser &&\
    adduser -S -G dockeruser --home /home/dockeruser -s /sbin/nologin dockeruser
RUN echo 'dockeruser:dockerpass' | chpasswd
RUN echo "dockeruser ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/dockeruser \
    && chmod 0440 /etc/sudoers.d/dockeruser
RUN chown -R dockeruser:dockeruser /home/dockeruser
ENV HOME=/home/dockeruser

RUN addgroup docker
USER dockeruser
RUN chmod g+s /home/dockeruser
RUN mkdir -p ~/.node
RUN mkdir -p ~/${CLICOMMAND}
RUN mkdir -p ~/test
WORKDIR $HOME

RUN echo "prefix = ~/.node" >> ~/.npmrc
ENV PATH=$HOME/.node/bin:$PATH
ENV NODE_PATH="$HOME/.node/lib/node_modules:$NODE_PATH"
ENV MANPATH="$HOME/.node/share/man:$MANPATH"

WORKDIR /home/dockeruser/${CLICOMMAND}
COPY ./package.json /home/dockeruser/${CLICOMMAND}
RUN npm install --production
COPY . /home/dockeruser/${CLICOMMAND}
RUN npm install -g

WORKDIR $HOME/test
