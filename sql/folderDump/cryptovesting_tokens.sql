CREATE DATABASE  IF NOT EXISTS `cryptovesting` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `cryptovesting`;
-- MySQL dump 10.13  Distrib 8.0.25, for Win64 (x86_64)
--
-- Host: localhost    Database: cryptovesting
-- ------------------------------------------------------
-- Server version	8.0.25

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tokens`
--

DROP TABLE IF EXISTS `tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tokens` (
  `uuid` varchar(255) NOT NULL,
  `token_name` varchar(255) NOT NULL,
  `bscscan_link` varchar(255) NOT NULL,
  `contract_hash` varchar(255) NOT NULL,
  PRIMARY KEY (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tokens`
--

LOCK TABLES `tokens` WRITE;
/*!40000 ALTER TABLE `tokens` DISABLE KEYS */;
INSERT INTO `tokens` VALUES ('1189389bde164da3a1fd6e029abb301e','BNB DOGE','https://bscscan.com/token/0xbd5f4fabef03aeb3ea0382892725ab9833b28844','0xbd5f4fabef03aeb3ea0382892725ab9833b28844'),('128e58a391344f01a3c24b36fb618553','Astro Inu','https://bscscan.com/token/0x539bc8973356caec25c5730f3b20b15ca6b8efc0','0x539bc8973356caec25c5730f3b20b15ca6b8efc0'),('2d03a82a210745ce9e9df4083545b9d6','Wiener Doge ','https://bscscan.com/token/0xd65fb6ddf5898239c9e41c52394b22c025763c9c','0xd65fb6ddf5898239c9e41c52394b22c025763c9c'),('300957ef9805464bb349d9b2e93e11a7','Frzn Coin','https://bscscan.com/token/0xd9a229c93c47c8be6c99f13ad3bff647f37bb809','0xd9a229c93c47c8be6c99f13ad3bff647f37bb809'),('471787fa68ce41e3ab7295ff56900fc6','DOGE&CAT','https://bscscan.com/token/0x64d1521691ec49d1cb4517b09b5edd3e85ebb5a3','0x64d1521691ec49d1cb4517b09b5edd3e85ebb5a3'),('4f766e994c97457388d33fdfcf8b06c3','KP, Me and the Magical World','https://bscscan.com/token/0x826fc6ccb9b2e8801ce830bf863b41f8e02bb430','0x826fc6ccb9b2e8801ce830bf863b41f8e02bb430'),('673e6ca6d3574a13b5abb4483f8badb8','KawaiINU','https://bscscan.com/token/0x0be1ab414a3465ec487bf89eabb723ae135390c3','0x0be1ab414a3465ec487bf89eabb723ae135390c3'),('701cd7ad3e324b618696b7f7bdf61899','TEST COIN','https://bscscan.com/token/0xd59d17585e3ccf14c65995c6ea1e791947e21183','0xd59d17585e3ccf14c65995c6ea1e791947e21183'),('831f5db7d3d047d58436d9264b4f7ef2','Astro Inu','https://bscscan.com/token/0xd9fab3b9cb01905d4fd4bdef7d0394d1ae441a6a','0xd9fab3b9cb01905d4fd4bdef7d0394d1ae441a6a'),('84a36516d5bb40a9b98507abf8e5a29b','CurrencyX','https://bscscan.com/token/0x103b6d6456853a8db7db962a0dcf64e0892797b9','0x103b6d6456853a8db7db962a0dcf64e0892797b9'),('8914b53104ea4db1bd3c3e1eda5e8c44','wakanda','https://bscscan.com/token/0x058813243c8d62e8d3ff86d8667b41de38953564','0x058813243c8d62e8d3ff86d8667b41de38953564'),('8b4951e8487d44f399105ed5508c1378','t.me/LiqLocked','https://bscscan.com/token/0xccb0f67d8a2869436c73ab39427d2fb0c544d7da','0xccb0f67d8a2869436c73ab39427d2fb0c544d7da'),('a7e645e269fe4d6dbfa93d0f6142c08d','BNB Doge ','https://bscscan.com/token/0xae9a5e62d5d5ad44005bae6f24e6709c294bf26e','0xae9a5e62d5d5ad44005bae6f24e6709c294bf26e'),('bae2b5cb27f6429f9b2ef83e930baff4','KISHICHO TOKEN','https://bscscan.com/token/0x9ba261cea0327fc933877aa64996bccc6e791f8c','0x9ba261cea0327fc933877aa64996bccc6e791f8c'),('d1072b7504774752b07d8b5b861e5871','HoneySwap','https://bscscan.com/token/0xe427a49cc82acde533980ab3f6f7a67f7d81f518','0xe427a49cc82acde533980ab3f6f7a67f7d81f518'),('e35bd3d1e7cd460c8d30a9daa1a40844','Lynx Moon','https://bscscan.com/token/0x5dae6d60f8d7f75926409ad411f59ebb10da6100','0x5dae6d60f8d7f75926409ad411f59ebb10da6100'),('e99560331721491f86b75b199e07fdc1','WaifuMoon','https://bscscan.com/token/0x96fa7c906482b518c998ab9a7f0bba93f290b1f6','0x96fa7c906482b518c998ab9a7f0bba93f290b1f6');
/*!40000 ALTER TABLE `tokens` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-05-31  0:22:33
