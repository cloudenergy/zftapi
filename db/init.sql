CREATE DATABASE IF NOT EXISTS zft;
USE zft;

create table if not exists entire
(
  `id` bigint(20) UNSIGNED NOT NULL,
  `projectId` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `geoLocation` bigint(20) UNSIGNED NOT NULL,
  `totalFloor` int(11) NOT NULL DEFAULT 0,
  `roomCountOnFloor` int(11) NOT NULL DEFAULT 0,
  `enabledFloors` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `createdAt` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `deleteAt` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `status` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'open',
  `config` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

create table if not exists soles
(
  `id` bigint(20) UNSIGNED NOT NULL,
  `projectId` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `code` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `geoLocation` bigint(20) UNSIGNED NOT NULL,
  `entireId` bigint(20) UNSIGNED NULL DEFAULT 0,
  `group` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `building` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `unit` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `roomNumber` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `currentFloor` int(11) NOT NULL DEFAULT 0,
  `totalFloor` int(11) NOT NULL DEFAULT 0,
  `createdAt` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `deleteAt` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `desc` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '',
  `status` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `config` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `houseKeeper` bigint(20) UNSIGNED NULL DEFAULT 0,
  `layoutId` bigint(20) UNSIGNED NULL DEFAULT 0,
  `houseFormat` varchar(8) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

create table if not exists rooms
(
  `id` bigint(20) UNSIGNED NOT NULL,
  `projectId` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `soleId` bigint(20) UNSIGNED NULL DEFAULT 0,
  `createdAt` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `deleteAt` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `desc` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `status` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'open',
  `config` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `name` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `type` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

create table if not exists contracts
(
	`id` bigint auto_increment,
	roomId bigint default '0' not null,
	userId bigint default '0' not null,
	`from` bigint default '0' not null,
	`to` bigint default '0' not null,
	strategy text null,
	expenses text null,
	contractNumber varchar(50) default '' not null,
	paymentPlan varchar(3) not null,
	signUpTime bigint default '0' not null,
  primary key (`id`)
) engine=innodb default charset=utf8;

create table if not exists bills
(
	id bigint auto_increment,
	flow varchar(10) default 'receive' not null,
	entity varchar(10) default 'tenant' not null,
	relativeID bigint default '0' not null,
	projectId varchar(64) not null,
	`source` tinyint(1) default '0' not null,
	`type` tinyint(1) default '0' not null,
	billFrom bigint default '0' not null,
	billTo bigint default '0' not null,
	paidAt bigint default '0' not null,
	amount bigint null,
	submitter bigint default '0' not null,
	operator bigint default '0' not null,
	timeCreate bigint default '0' not null,
	remark varchar(255) default '' null,
	metadata text null,
	primary key (`id`)
) engine=innodb default charset=utf8;

create table if not exists users
(
	id bigint auto_increment,
	accountName varchar(32) not null,
	`name` varchar(24) not null,
	mobile varchar(13) not null,
	documentId text null,
	documentType int default '1' null,
	gender varchar(1) default 'M' not null,
	constraint users_accountName_unique
		unique (accountName),
		primary key (`id`)
) engine=innodb default charset=utf8;

create table if not exists layouts
(
  `id` bigint(20) UNSIGNED NOT NULL,
  `instanceId` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `bedRoom` int(11) NOT NULL DEFAULT 0,
  `livingRoom` int(11) NOT NULL DEFAULT 0,
  `bathRoom` int(11) NOT NULL DEFAULT 0,
  `orientation` varchar(2) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'N',
  `roomArea` int(11) NOT NULL DEFAULT 0,
  `remark` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `deleteAt` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

create table if not exists houses
(
	id bigint auto_increment,
	code varchar(10) default '' not null,
	houseFormat varchar(12) default 'individual' not null,
	projectId varchar(64) default '' not null,
	community varchar(255) default '' not null,
	`group` varchar(10) default '' not null,
	building varchar(10) default '' not null,
	unit varchar(10) default '' not null,
	roomNumber varchar(10) default '' not null,
	roomArea int default '0' not null,
	currentFloor int default '0' not null,
	totalFloor int default '0' not null,
	roomCountOnFloor int default '0' not null,
	createdAt bigint default '0' not null,
	deleteAt bigint default '0' not null,
	`desc` varchar(255) null,
	status varchar(10) default 'open' not null,
	config text null,
  primary key (`id`)
) engine=innodb default charset=utf8;

create table if not exists location
(
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(12) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `divisionId` bigint(20) UNSIGNED NOT NULL,
  `district` varchar(16) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `name` varchar(16) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `address` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `longitude` decimal(9, 5) NOT NULL,
  `latitude` decimal(9, 5) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 20 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

create table if not exists division
(
	id int auto_increment,
	name varchar(255) not null,
  primary key (`id`)
) engine=innodb default charset=utf8;

create table if not exists `settings`
(
	id int auto_increment,
	projectId bigint null,
	`group` varchar(128) default '' not null,
	`key` varchar(255) default '' not null,
	value varchar(255) default '' not null,
  primary key (`id`)
) engine=innodb default charset=utf8;



