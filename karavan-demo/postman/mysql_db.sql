-- create the databases
CREATE DATABASE IF NOT EXISTS demo;
CREATE TABLE IF NOT EXISTS demo ( id int(11) NOT NULL, name varchar(250)  NOT NULL default '',  PRIMARY KEY  (id));