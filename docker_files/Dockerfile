FROM ubuntu:19.04

RUN apt-get update && apt-get install -y curl git sudo
RUN curl -sL https://deb.nodesource.com/setup_13.x | sudo -E bash -
RUN sudo apt-get install -y nodejs

ARG CLICOMMAND_ARG
RUN test -n "$CLICOMMAND_ARG" || (echo "CLICOMMAND_ARG not set" && false)
ENV CLICOMMAND $CLICOMMAND_ARG
ENV TINI_VERSION v0.18.0
RUN curl -sL https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini -o /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

RUN groupadd -r dockeruser &&\
    useradd -r -g dockeruser -m -d /home/dockeruser -s /sbin/nologin dockeruser
RUN echo 'dockeruser:dockerpass' | chpasswd
RUN usermod -aG sudo dockeruser
RUN chown -R dockeruser:dockeruser /home/dockeruser
ENV HOME=/home/dockeruser

RUN groupadd docker
RUN gpasswd -a dockeruser docker
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
COPY ./package.json /home/dockeruser/{CLICOMMAND}
RUN npm install --save-dev
COPY . /home/dockeruser/${CLICOMMAND}
RUN npm install -g

WORKDIR $HOME/test
