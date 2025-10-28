-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.31 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for pos_restaurant
CREATE DATABASE IF NOT EXISTS `pos_restaurant` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `pos_restaurant`;

-- Dumping structure for table pos_restaurant.categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_bin NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_categories_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Dumping data for table pos_restaurant.categories: ~6 rows (approximately)
INSERT INTO `categories` (`id`, `name`, `created_at`) VALUES
	(1, 'Appetizers', '2025-09-21 18:56:49'),
	(2, 'Main Course', '2025-09-21 18:56:49'),
	(3, 'Beverages', '2025-09-21 18:56:49'),
	(4, 'Desserts', '2025-09-21 18:56:49'),
	(5, 'Salads', '2025-09-21 18:56:49'),
	(6, 'Burgers', '2025-09-22 11:08:23');

-- Dumping structure for table pos_restaurant.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_bin NOT NULL,
  `mobile` varchar(15) COLLATE utf8mb4_bin NOT NULL,
  `address` text COLLATE utf8mb4_bin,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile` (`mobile`),
  UNIQUE KEY `idx_customers_mobile` (`mobile`),
  KEY `idx_customers_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Dumping data for table pos_restaurant.customers: ~22 rows (approximately)
INSERT INTO `customers` (`id`, `name`, `mobile`, `address`, `created_at`) VALUES
	(1, 'Abdullah', '0771414818', '', '2025-09-21 19:11:03'),
	(2, 'Kind', '0750664818', '', '2025-09-22 08:30:09'),
	(3, 'John Smith', '0771234567', '123 Main Street, Colombo 03', '2025-09-23 06:01:11'),
	(4, 'Sarah Johnson', '0779876543', '456 Galle Road, Dehiwala', '2025-09-23 06:01:11'),
	(5, 'Mike Brown', '0712345678', '789 Kandy Road, Malabe', '2025-09-23 06:01:11'),
	(6, 'Lisa Wilson', '0787654321', '321 Negombo Road, Wattala', '2025-09-23 06:01:11'),
	(7, 'David Lee', '0751234567', '654 High Level Road, Nugegoda', '2025-09-23 06:01:11'),
	(8, 'Emma Davis', '0769876543', '987 Baseline Road, Colombo 09', '2025-09-23 06:01:11'),
	(9, 'James Wilson', '0723456789', '147 Duplication Road, Colombo 04', '2025-09-23 06:01:11'),
	(10, 'Maria Garcia', '0786543210', '258 Parliament Road, Battaramulla', '2025-09-23 06:01:11'),
	(11, 'Robert Johnson', '0771111111', '369 Old Kesbewa Road, Piliyandala', '2025-09-23 06:01:11'),
	(12, 'Anna Martinez', '0772222222', '741 Maharagama Road, Maharagama', '2025-09-23 06:01:11'),
	(13, 'Chris Anderson', '0773333333', '852 Horana Road, Panadura', '2025-09-23 06:01:11'),
	(14, 'Sophie Taylor', '0774444444', '963 Avissawella Road, Homagama', '2025-09-23 06:01:11'),
	(15, 'Mark Thompson', '0775555555', '159 Kotte Road, Rajagiriya', '2025-09-23 06:01:11'),
	(16, 'Rachel Green', '0776666666', '753 Maharagama Road, Boralesgamuwa', '2025-09-23 06:01:11'),
	(17, 'Alex Johnson', '0777777777', '864 Old Kotte Road, Nugegoda', '2025-09-23 06:01:11'),
	(18, 'Monica Walsh', '0778888888', '951 High Level Road, Maharagama', '2025-09-23 06:01:11'),
	(19, 'Daniel Kim', '0779999999', '357 Galle Road, Mount Lavinia', '2025-09-23 06:01:11'),
	(20, 'Jessica Wong', '0770000000', '468 Baseline Road, Colombo 08', '2025-09-23 06:01:11'),
	(21, 'Ryan Murphy', '0771010101', '579 Parliament Road, Kotte', '2025-09-23 06:01:11'),
	(22, 'Isabella Chen', '0772020202', '681 Duplication Road, Colombo 06', '2025-09-23 06:01:11'),
	(23, 'Uber Eats', '0117733966', NULL, '2025-09-23 06:20:30'),
	(24, 'Pickme Food', '0117433433', NULL, '2025-09-23 06:20:43'),
	(25, 'Cash', '000', NULL, '2025-09-23 06:21:15'),
	(26, 'Mohamed Zufar', '0777940645', '', '2025-09-24 20:27:55');

-- Dumping structure for table pos_restaurant.expenses
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` text COLLATE utf8mb4_bin NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_expenses_date` (`date`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Dumping data for table pos_restaurant.expenses: ~2 rows (approximately)
INSERT INTO `expenses` (`id`, `description`, `amount`, `date`) VALUES
	(1, 'Water Bill', 25000.00, '2025-09-23'),
	(2, 'Electricity Bill', 30000.00, '2025-09-23'),
	(3, 'Salary', 450000.00, '2025-09-23');

-- Dumping structure for table pos_restaurant.menu_items
CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_bin NOT NULL,
  `description` text COLLATE utf8mb4_bin,
  `price` decimal(10,2) NOT NULL,
  `image_path` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_menu_items_category_id` (`category_id`),
  KEY `idx_menu_items_is_deleted` (`is_deleted`),
  KEY `idx_menu_items_name` (`name`),
  KEY `idx_menu_items_category_active` (`category_id`,`is_deleted`),
  CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Dumping data for table pos_restaurant.menu_items: ~6 rows (approximately)
INSERT INTO `menu_items` (`id`, `name`, `description`, `price`, `image_path`, `category_id`, `created_at`, `is_active`, `is_deleted`) VALUES
	(1, 'Chicken Wings', 'Spicy buffalo wings with ranch dip', 12.99, 'uploads/menu/68d12ddf0bec4.jpeg', 1, '2025-09-21 18:56:49', 1, 0),
	(2, 'Caesar Salad', 'Fresh romaine lettuce with caesar dressing', 8.99, 'uploads/menu/68d12e13a5823.jpeg', 5, '2025-09-21 18:56:49', 0, 0),
	(3, 'Grilled Chicken', 'Herb marinated grilled chicken breast', 18.99, 'uploads/menu/68d12df8ab898.jpeg', 2, '2025-09-21 18:56:49', 1, 0),
	(4, 'Coca Cola', 'Refreshing soft drink', 2.99, 'uploads/menu/68d12e010f494.jpeg', 3, '2025-09-21 18:56:49', 1, 0),
	(5, 'Chocolate Cake', 'Rich chocolate layer cake', 6.99, 'uploads/menu/68d12de82ea2c.jpeg', 4, '2025-09-21 18:56:49', 1, 0),
	(6, 'Cheesy Burger', '', 2500.00, 'uploads/menu/68d12e41e3f95.jpeg', 6, '2025-09-22 11:08:49', 1, 0);

-- Dumping structure for table pos_restaurant.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_type` enum('Dine In','Take Away','Delivery','Uber Eats','Pickme Food') COLLATE utf8mb4_bin NOT NULL,
  `customer_id` int DEFAULT NULL,
  `table_id` int DEFAULT NULL,
  `external_order_id` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `status` enum('Hold','Completed','Cancelled') COLLATE utf8mb4_bin DEFAULT 'Hold',
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `discount_type` enum('percentage','fixed') COLLATE utf8mb4_bin DEFAULT NULL,
  `discount_value` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `final_amount` decimal(10,2) DEFAULT '0.00',
  `paid_amount` decimal(10,2) DEFAULT '0.00',
  `balance` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_created_at` (`created_at`),
  KEY `idx_orders_status_date` (`status`,`created_at`),
  KEY `idx_orders_customer_id` (`customer_id`),
  KEY `idx_orders_status_covering` (`status`,`id`,`total_amount`),
  KEY `idx_orders_order_type` (`order_type`),
  KEY `idx_orders_table_id` (`table_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Dumping data for table pos_restaurant.orders: ~36 rows (approximately)
INSERT INTO `orders` (`id`, `order_type`, `customer_id`, `table_id`, `external_order_id`, `status`, `total_amount`, `discount_type`, `discount_value`, `discount_amount`, `final_amount`, `paid_amount`, `balance`, `created_at`) VALUES
	(1, 'Take Away', 1, NULL, NULL, 'Completed', 43.96, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-21 19:11:03'),
	(2, 'Take Away', 1, NULL, NULL, 'Completed', 37.96, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-22 06:30:38'),
	(3, 'Take Away', 1, NULL, NULL, 'Completed', 12.97, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-22 08:03:16'),
	(4, 'Dine In', 1, 1, NULL, 'Completed', 55.94, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-22 08:05:59'),
	(5, 'Dine In', 2, 1, NULL, 'Cancelled', 189.82, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-22 08:30:09'),
	(6, 'Take Away', 1, NULL, NULL, 'Completed', 38.95, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-22 09:18:46'),
	(7, 'Dine In', 3, 1, NULL, 'Completed', 2500.00, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(8, 'Dine In', 4, 3, NULL, 'Completed', 1850.75, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(9, 'Dine In', 5, 5, NULL, 'Cancelled', 3200.50, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(10, 'Dine In', 6, 2, NULL, 'Completed', 1450.25, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(11, 'Take Away', 7, NULL, NULL, 'Completed', 1200.00, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(12, 'Take Away', 8, NULL, NULL, 'Completed', 890.50, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(13, 'Take Away', 9, NULL, NULL, 'Cancelled', 1650.75, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(14, 'Take Away', 10, NULL, NULL, 'Cancelled', 750.25, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(15, 'Delivery', 11, NULL, '', 'Completed', 2100.00, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(16, 'Delivery', 12, NULL, '', 'Completed', 1750.50, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(17, 'Delivery', 13, NULL, '', 'Cancelled', 2850.75, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(18, 'Delivery', 14, NULL, '', 'Completed', 1320.25, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(19, 'Uber Eats', 23, NULL, 'UE20240115001', 'Completed', 1890.00, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(20, 'Uber Eats', 23, NULL, 'UE20240115002', 'Completed', 2450.50, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(21, 'Uber Eats', 23, NULL, 'UE20240115003', 'Cancelled', 1675.75, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(22, 'Uber Eats', 23, NULL, 'UE20240115004', 'Completed', 3100.25, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(23, 'Pickme Food', 24, NULL, 'PMF20240115001', 'Completed', 1540.00, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(24, 'Pickme Food', 24, NULL, 'PMF20240115002', 'Completed', 2220.50, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(25, 'Pickme Food', 24, NULL, 'PMF20240115003', 'Cancelled', 1890.75, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(26, 'Pickme Food', 24, NULL, 'PMF20240115004', 'Completed', 2650.25, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-15 07:45:00'),
	(27, 'Uber Eats', 23, NULL, '2522', 'Completed', 2547.96, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-23 06:35:56'),
	(28, 'Uber Eats', 23, NULL, '9666', 'Completed', 5028.97, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-23 06:41:23'),
	(29, 'Pickme Food', 24, NULL, '2555396', 'Completed', 5000.00, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-23 06:43:42'),
	(30, 'Take Away', 26, NULL, NULL, 'Cancelled', 8.99, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-09-25 05:49:17'),
	(31, 'Take Away', 1, NULL, NULL, 'Cancelled', 0.00, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-10-07 05:30:44'),
	(32, 'Take Away', 2, NULL, NULL, 'Cancelled', 27.98, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-10-07 05:46:09'),
	(33, 'Take Away', 1, NULL, NULL, 'Cancelled', 2521.98, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-10-20 10:08:09'),
	(34, 'Take Away', 1, NULL, NULL, 'Cancelled', 22.97, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-10-20 10:11:30'),
	(35, 'Take Away', 1, NULL, NULL, 'Completed', 2556.95, 'fixed', 556.95, 556.95, 2000.00, 5000.00, 3000.00, '2025-10-26 12:07:56'),
	(36, 'Take Away', 1, NULL, NULL, 'Completed', 40.97, 'fixed', 0.97, 0.97, 40.00, 49.97, 9.97, '2025-10-26 13:57:41'),
	(37, 'Take Away', 1, NULL, NULL, 'Cancelled', 0.00, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-10-27 06:28:16'),
	(38, 'Take Away', 1, NULL, NULL, 'Cancelled', 0.00, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-10-27 06:36:42'),
	(39, 'Take Away', 1, NULL, NULL, 'Cancelled', 0.00, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-10-27 06:40:00'),
	(40, 'Take Away', 1, NULL, NULL, 'Completed', 2521.98, 'fixed', 0.00, 0.00, 2521.98, 3000.00, 478.02, '2025-10-27 06:42:55'),
	(41, 'Take Away', 1, NULL, NULL, 'Cancelled', 0.00, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-10-27 06:43:48'),
	(42, 'Take Away', 1, NULL, NULL, 'Cancelled', 21.98, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-10-27 07:06:01'),
	(43, 'Take Away', 1, NULL, NULL, 'Cancelled', 0.00, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-10-27 07:08:45'),
	(44, 'Take Away', 1, NULL, NULL, 'Hold', 2512.99, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-10-27 10:33:36');

-- Dumping structure for table pos_restaurant.orders_archive
CREATE TABLE IF NOT EXISTS `orders_archive` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_type` enum('Dine In','Take Away','Delivery','Uber Eats','Pickme Food') COLLATE utf8mb4_bin NOT NULL,
  `customer_id` int DEFAULT NULL,
  `table_id` int DEFAULT NULL,
  `external_order_id` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `status` enum('Hold','Completed','Cancelled') COLLATE utf8mb4_bin DEFAULT 'Hold',
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `discount_type` enum('percentage','fixed') COLLATE utf8mb4_bin DEFAULT NULL,
  `discount_value` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `final_amount` decimal(10,2) DEFAULT '0.00',
  `paid_amount` decimal(10,2) DEFAULT '0.00',
  `balance` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `table_id` (`table_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_created_at` (`created_at`),
  KEY `idx_orders_status_date` (`status`,`created_at`),
  KEY `idx_orders_customer_id` (`customer_id`),
  KEY `idx_orders_status_covering` (`status`,`id`,`total_amount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Dumping data for table pos_restaurant.orders_archive: ~0 rows (approximately)

-- Dumping structure for table pos_restaurant.order_items
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `menu_item_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `price_per_item` decimal(10,2) NOT NULL,
  `notes` text COLLATE utf8mb4_bin,
  `kot_printed` tinyint(1) DEFAULT '0',
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`order_id`),
  KEY `idx_order_items_menu_item_id` (`menu_item_id`),
  KEY `idx_order_items_kot_printed` (`kot_printed`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Dumping data for table pos_restaurant.order_items: ~72 rows (approximately)
INSERT INTO `order_items` (`id`, `order_id`, `menu_item_id`, `quantity`, `price_per_item`, `notes`, `kot_printed`, `added_at`) VALUES
	(6, 1, 2, 2, 8.99, NULL, 1, '2025-09-25 05:55:45'),
	(7, 1, 1, 2, 12.99, NULL, 1, '2025-09-25 05:55:45'),
	(8, 2, 2, 1, 8.99, NULL, 1, '2025-09-25 05:55:45'),
	(9, 2, 1, 2, 12.99, NULL, 1, '2025-09-25 05:55:45'),
	(10, 2, 4, 1, 2.99, NULL, 1, '2025-09-25 05:55:45'),
	(11, 4, 5, 3, 6.99, NULL, 1, '2025-09-25 05:55:45'),
	(12, 4, 1, 2, 12.99, NULL, 1, '2025-09-25 05:55:45'),
	(13, 4, 2, 1, 8.99, NULL, 1, '2025-09-25 05:55:45'),
	(14, 3, 4, 2, 2.99, NULL, 1, '2025-09-25 05:55:45'),
	(15, 3, 5, 1, 6.99, NULL, 1, '2025-09-25 05:55:45'),
	(26, 6, 1, 1, 12.99, NULL, 1, '2025-09-25 05:55:45'),
	(27, 6, 2, 1, 8.99, NULL, 1, '2025-09-25 05:55:45'),
	(28, 6, 5, 2, 6.99, NULL, 1, '2025-09-25 05:55:45'),
	(29, 6, 4, 1, 2.99, NULL, 1, '2025-09-25 05:55:45'),
	(30, 7, 1, 3, 12.99, NULL, 1, '2025-09-25 05:55:45'),
	(31, 7, 3, 2, 18.99, NULL, 1, '2025-09-25 05:55:45'),
	(32, 7, 4, 4, 2.99, NULL, 1, '2025-09-25 05:55:45'),
	(33, 8, 2, 2, 8.99, NULL, 1, '2025-09-25 05:55:45'),
	(34, 8, 5, 1, 6.99, NULL, 1, '2025-09-25 05:55:45'),
	(35, 8, 1, 1, 12.99, NULL, 1, '2025-09-25 05:55:45'),
	(36, 10, 3, 1, 18.99, NULL, 1, '2025-09-25 05:55:45'),
	(37, 10, 4, 3, 2.99, NULL, 1, '2025-09-25 05:55:45'),
	(38, 10, 5, 2, 6.99, NULL, 1, '2025-09-25 05:55:45'),
	(39, 11, 1, 2, 12.99, NULL, 1, '2025-09-25 05:55:45'),
	(40, 11, 2, 1, 8.99, NULL, 1, '2025-09-25 05:55:45'),
	(41, 11, 4, 2, 2.99, NULL, 1, '2025-09-25 05:55:45'),
	(42, 12, 5, 3, 6.99, NULL, 1, '2025-09-25 05:55:45'),
	(43, 12, 4, 5, 2.99, NULL, 1, '2025-09-25 05:55:45'),
	(44, 15, 3, 3, 18.99, NULL, 1, '2025-09-25 05:55:45'),
	(45, 15, 1, 1, 12.99, NULL, 1, '2025-09-25 05:55:45'),
	(46, 15, 4, 2, 2.99, NULL, 1, '2025-09-25 05:55:45'),
	(47, 16, 2, 2, 8.99, NULL, 1, '2025-09-25 05:55:45'),
	(48, 16, 3, 1, 18.99, NULL, 1, '2025-09-25 05:55:45'),
	(49, 16, 5, 2, 6.99, NULL, 1, '2025-09-25 05:55:45'),
	(50, 18, 1, 1, 12.99, NULL, 1, '2025-09-25 05:55:45'),
	(51, 18, 4, 4, 2.99, NULL, 1, '2025-09-25 05:55:45'),
	(52, 19, 3, 2, 18.99, NULL, 1, '2025-09-25 05:55:45'),
	(53, 19, 4, 3, 2.99, NULL, 1, '2025-09-25 05:55:45'),
	(54, 20, 1, 4, 12.99, NULL, 1, '2025-09-25 05:55:45'),
	(55, 20, 2, 1, 8.99, NULL, 1, '2025-09-25 05:55:45'),
	(56, 20, 5, 3, 6.99, NULL, 1, '2025-09-25 05:55:45'),
	(57, 27, 2, 1, 8.99, NULL, 1, '2025-09-25 05:55:45'),
	(58, 27, 6, 1, 2500.00, NULL, 1, '2025-09-25 05:55:45'),
	(59, 27, 1, 1, 12.99, NULL, 1, '2025-09-25 05:55:45'),
	(60, 27, 5, 1, 6.99, NULL, 1, '2025-09-25 05:55:45'),
	(61, 27, 3, 1, 18.99, NULL, 1, '2025-09-25 05:55:45'),
	(62, 28, 6, 2, 2500.00, NULL, 1, '2025-09-25 05:55:45'),
	(63, 28, 1, 1, 12.99, NULL, 1, '2025-09-25 05:55:45'),
	(64, 28, 5, 1, 6.99, NULL, 1, '2025-09-25 05:55:45'),
	(65, 28, 2, 1, 8.99, NULL, 1, '2025-09-25 05:55:45'),
	(66, 29, 6, 2, 2500.00, NULL, 1, '2025-09-25 05:55:45'),
	(67, 5, 1, 4, 12.99, NULL, 1, '2025-09-25 05:55:45'),
	(68, 5, 2, 6, 8.99, NULL, 1, '2025-09-25 05:55:45'),
	(69, 5, 3, 3, 18.99, NULL, 1, '2025-09-25 05:55:45'),
	(70, 5, 4, 2, 2.99, NULL, 1, '2025-09-25 05:55:45'),
	(71, 5, 5, 3, 6.99, NULL, 1, '2025-09-25 05:55:45'),
	(72, 30, 2, 1, 8.99, NULL, 1, '2025-09-25 05:55:45'),
	(73, 32, 2, 1, 8.99, NULL, 0, '2025-10-07 05:46:13'),
	(74, 32, 3, 1, 18.99, NULL, 0, '2025-10-07 05:46:13'),
	(75, 33, 2, 1, 8.99, NULL, 0, '2025-10-20 10:08:25'),
	(76, 33, 6, 1, 2500.00, NULL, 0, '2025-10-20 10:08:25'),
	(77, 33, 1, 1, 12.99, NULL, 0, '2025-10-20 10:08:25'),
	(79, 34, 1, 1, 12.99, NULL, 1, '2025-10-21 06:22:44'),
	(80, 34, 4, 1, 2.99, NULL, 0, '2025-10-21 06:22:44'),
	(81, 34, 5, 1, 6.99, NULL, 0, '2025-10-21 06:22:44'),
	(82, 35, 6, 1, 2500.00, '', 0, '2025-10-26 12:22:02'),
	(83, 35, 1, 1, 12.99, '', 0, '2025-10-26 12:22:02'),
	(84, 35, 4, 2, 2.99, '', 0, '2025-10-26 12:22:02'),
	(85, 35, 3, 2, 18.99, '', 0, '2025-10-26 12:22:02'),
	(86, 36, 2, 1, 8.99, '', 0, '2025-10-26 13:57:50'),
	(87, 36, 3, 1, 18.99, '', 0, '2025-10-26 13:57:50'),
	(88, 36, 1, 1, 12.99, '', 0, '2025-10-26 13:57:50'),
	(89, 40, 2, 1, 8.99, '', 0, '2025-10-27 06:43:11'),
	(90, 40, 6, 1, 2500.00, '', 0, '2025-10-27 06:43:11'),
	(91, 40, 1, 1, 12.99, '', 0, '2025-10-27 06:43:11'),
	(92, 42, 4, 1, 2.99, '', 0, '2025-10-27 07:08:29'),
	(93, 42, 3, 1, 18.99, '', 0, '2025-10-27 07:08:29'),
	(94, 44, 6, 1, 2500.00, '', 0, '2025-10-27 10:33:36'),
	(95, 44, 1, 1, 12.99, '', 0, '2025-10-27 10:33:36');

-- Dumping structure for table pos_restaurant.payments
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `payment_method` enum('Cash','Card','Bank Transfer','Uber Eats','PickMe Food') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payments_order_id` (`order_id`),
  KEY `idx_payments_method` (`payment_method`),
  KEY `idx_payments_payment_date` (`payment_date`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Dumping data for table pos_restaurant.payments: ~21 rows (approximately)
INSERT INTO `payments` (`id`, `order_id`, `payment_method`, `amount`, `payment_date`) VALUES
	(1, 1, 'Cash', 43.96, '2025-09-21 19:13:09'),
	(2, 3, 'Card', 12.97, '2025-09-22 08:09:38'),
	(3, 4, 'Cash', 55.94, '2025-09-22 08:09:45'),
	(4, 2, 'Cash', 37.96, '2025-09-22 08:09:53'),
	(5, 6, 'Card', 38.95, '2025-09-22 09:19:10'),
	(6, 7, 'Cash', 2500.00, '2024-01-15 07:05:00'),
	(7, 8, 'Card', 1850.75, '2024-01-15 07:50:00'),
	(8, 10, 'Card', 1450.25, '2024-01-15 13:20:00'),
	(9, 11, 'Cash', 1200.00, '2024-01-15 05:55:00'),
	(10, 12, 'Card', 890.50, '2024-01-15 07:20:00'),
	(11, 15, 'Cash', 2100.00, '2024-01-15 14:05:00'),
	(12, 16, 'Card', 1750.50, '2024-01-15 14:50:00'),
	(13, 18, 'Card', 1320.25, '2024-01-15 14:20:00'),
	(14, 19, 'Uber Eats', 1890.00, '2024-01-15 06:35:00'),
	(15, 20, 'Uber Eats', 2450.50, '2024-01-15 08:05:00'),
	(16, 22, 'Uber Eats', 3100.25, '2024-01-15 12:35:00'),
	(17, 23, 'PickMe Food', 1540.00, '2024-01-15 09:20:00'),
	(18, 24, 'PickMe Food', 2220.50, '2024-01-15 11:05:00'),
	(19, 26, 'PickMe Food', 2650.25, '2024-01-15 16:05:00'),
	(20, 27, 'Uber Eats', 2547.96, '2025-09-23 06:37:38'),
	(21, 28, 'Uber Eats', 5028.97, '2025-09-23 06:41:29'),
	(22, 29, 'PickMe Food', 5000.00, '2025-09-23 06:43:45'),
	(23, 35, 'Cash', 2000.00, '2025-10-26 12:30:15'),
	(24, 36, 'Cash', 40.00, '2025-10-26 13:58:02'),
	(25, 40, 'Cash', 2521.98, '2025-10-27 06:43:29');

-- Dumping structure for table pos_restaurant.settings
CREATE TABLE IF NOT EXISTS `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `restaurant_name` varchar(255) COLLATE utf8mb4_bin NOT NULL DEFAULT 'My Restaurant',
  `address` text COLLATE utf8mb4_bin,
  `mobile` varchar(20) COLLATE utf8mb4_bin DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_bin DEFAULT NULL,
  `tax_rate` decimal(5,2) DEFAULT '0.00',
  `print_kot` tinyint(1) DEFAULT '1',
  `print_invoice` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Dumping data for table pos_restaurant.settings: ~0 rows (approximately)
INSERT INTO `settings` (`id`, `restaurant_name`, `address`, `mobile`, `email`, `tax_rate`, `print_kot`, `print_invoice`, `created_at`, `updated_at`) VALUES
	(1, 'Frango Crispy Fried', 'Kolonnawa Rd, Wellampitiya', '+94771414818', 'info@frangocf.com', 0.00, 1, 1, '2025-09-25 05:22:05', '2025-10-07 05:57:42');

-- Dumping structure for table pos_restaurant.tables
CREATE TABLE IF NOT EXISTS `tables` (
  `id` int NOT NULL AUTO_INCREMENT,
  `table_name` varchar(20) COLLATE utf8mb4_bin NOT NULL,
  `status` enum('Available','Occupied') COLLATE utf8mb4_bin DEFAULT 'Available',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tables_name` (`table_name`),
  KEY `idx_tables_status` (`status`),
  KEY `idx_tables_is_deleted` (`is_deleted`),
  KEY `idx_tables_status_active` (`status`,`is_deleted`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Dumping data for table pos_restaurant.tables: ~5 rows (approximately)
INSERT INTO `tables` (`id`, `table_name`, `status`, `created_at`, `is_active`, `is_deleted`) VALUES
	(1, 'Table 10', 'Available', '2025-09-23 04:47:07', 1, 0),
	(2, 'Table 2', 'Available', '2025-09-23 04:47:07', 1, 0),
	(3, 'Table 3', 'Available', '2025-09-23 04:47:07', 1, 0),
	(4, 'Table 4', 'Available', '2025-09-23 04:47:07', 1, 0),
	(5, 'Table 5', 'Available', '2025-09-23 04:47:07', 1, 0),
	(11, 'Table 6', 'Available', '2025-09-23 04:56:05', 1, 0);

-- Dumping structure for table pos_restaurant.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_bin NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `role` enum('Super Admin','Admin','Cashier') COLLATE utf8mb4_bin NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `idx_users_username` (`username`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_is_deleted` (`is_deleted`),
  KEY `idx_users_username_active` (`username`,`is_deleted`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Dumping data for table pos_restaurant.users: ~4 rows (approximately)
INSERT INTO `users` (`id`, `username`, `password`, `role`, `created_at`, `is_deleted`, `deleted_at`) VALUES
	(1, 'superadmin', '$2y$10$stP1n2YFbK3fqb0yaXS4lOTd9zX7GMV/S7HfwCgAARen3tnDzc6ki', 'Super Admin', '2025-09-21 18:56:49', 0, NULL),
	(2, 'admin', '$2y$10$stP1n2YFbK3fqb0yaXS4lOTd9zX7GMV/S7HfwCgAARen3tnDzc6ki', 'Admin', '2025-09-21 18:56:49', 0, NULL),
	(3, 'cashier', '$2y$10$tWiCQXOj0.jOAbEy8T78AuQqI2l4zXGIocHdBNU/c52xXt3gMLrbW', 'Cashier', '2025-10-27 05:18:59', 0, NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
