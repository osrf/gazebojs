# gazebojs

This project offers NodeJs bindings for the Gazebo simulator (http://www.gazebosim.org/)

* Gazebo must be installed first.
* The version of gazebojs follows the version of Gazebo, so you should use gazebojs 6 if you have Gazebo 6 installed


## Prerequisites

In addition to Gazebo, you must also install: 

* nodejs: sudo apt-get install npm nodejs nodejs-legacy
* jansson: sudo apt-get install libjansson-dev
* libgazeboX-dev (where X is your Gazebo version see http://gazebosim.org/tutorials?tut=install)


## Setup

Here are the steps for Xenial

``` 
mkdir simjs
cd simjs

# install node and gazebo
sudo apt install -y gazebo7 libgazebo7-dev libjansson-dev npm nodejs nodejs-legacy 

# setup an empty node project 
npm init -y
npm install gazebojs

```
Please take a moment to look at the tutorials: http://gazebosim.org/tutorials?cat=gazebojs

## Ubuntu and node

In Ubuntu Trusty (14.04), the default version of Node is 0.10.x.
In Ubuntu Xenial (16.04), the default version of Node is 4.2.x

Node 0.10 is compatible with Gazebo 4 to 6, while 4.2.x is required for Gazebo 7 and up. 
Please refer to the installation tutorial http://gazebosim.org/tutorials?tut=gazebojs_install&cat=gazebojs for more details
on how to change your version of Node.
