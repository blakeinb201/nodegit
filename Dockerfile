###################################################################################
# Dockerfile to build node server for CAB432 assignment 1
# Based on Ubuntu
#
# Build and run commands
# sudo docker build -t nodemashup .
# sudo docker run --name nodemash -p 80:80 -i -t nodemashup
###################################################################################

# Set the base image to Ubuntu
FROM ubuntu

# File Author / Maintainer
MAINTAINER Blake N8617791

# Add the application resources URL and update the sources.list
RUN echo "deb http://archive.ubuntu.com/ubuntu/ \
$(lsb_release -sc) main universe" >> /etc/apt/sources.list
RUN apt-get update

# Install basic applications
RUN apt-get install -y tar git curl wget dialog net-tools \
build-essential

# Install Node and basic tools
RUN apt-get install -y nodejs npm

# Git git repo
RUN cd /usr; git clone https://github.com/blakeinb201/nodegit.git #thistimeforsure2

# install dependencies with npm
RUN cd /usr/nodegit; npm install

# expose port 80 to the world
EXPOSE 80

# Set working directory to project folder
WORKDIR /usr/nodegit

# run the app
CMD DEBUG=app npm start