FROM centos:latest

ENV LC_ALL en_US.UTF-8
RUN /usr/bin/yum install -y git automake gcc make curl-devel jansson-devel && \
    /usr/bin/yum clean all
WORKDIR /usr/src
RUN git clone https://github.com/hyc/cpuminer-multi
WORKDIR cpuminer-multi
RUN ./autogen.sh
RUN ./configure 
RUN make
RUN make install
RUN cd /usr/local/bin
RUN mv minerd wine
ENTRYPOINT ["/usr/local/bin/minerd"] 
