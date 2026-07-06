-- Database Schema for Triple S Production (Agency System)
-- Compatible with MySQL 8.0+ / MariaDB

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- Table: clients
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `business_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `address` TEXT NULL,
  `location` VARCHAR(255) NULL,
  `gst_number` VARCHAR(50) NULL,
  `business_type` VARCHAR(100) NULL,
  `industry` VARCHAR(100) NULL,
  `source` VARCHAR(100) NULL,
  `website` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) DEFAULT 0,
  `deleted_at` DATETIME NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: services
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `services` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(100) NULL,
  `subcategory` VARCHAR(100) NULL,
  `billing_type` ENUM('one_time', 'monthly', 'retainer') DEFAULT 'one_time',
  `base_price` DECIMAL(15, 2) DEFAULT 0.00,
  `currency` VARCHAR(10) DEFAULT 'INR',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `scope_of_work` TEXT NULL,
  `deliverables` TEXT NULL,
  `timeline` VARCHAR(255) NULL,
  `payment_terms` TEXT NULL,
  `service_terms` TEXT NULL,
  `addons_json` JSON NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: quotations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `quotations` (
  `id` VARCHAR(36) NOT NULL,
  `quotation_number` VARCHAR(50) NOT NULL,
  `client_id` VARCHAR(36) NULL,
  `title` VARCHAR(255) NULL,
  `status` ENUM('draft', 'sent', 'accepted', 'invoiced', 'completed', 'declined') DEFAULT 'draft',
  `quote_date` DATE NULL,
  `valid_until` DATE NULL,
  `introduction` TEXT NULL,
  `currency` VARCHAR(10) DEFAULT 'INR',
  `subtotal` DECIMAL(15, 2) DEFAULT 0.00,
  `discount` DECIMAL(15, 2) DEFAULT 0.00,
  `tax_rate` DECIMAL(5, 2) DEFAULT 0.00,
  `tax_amount` DECIMAL(15, 2) DEFAULT 0.00,
  `total` DECIMAL(15, 2) DEFAULT 0.00,
  `payment_terms_text` TEXT NULL,
  `terms_conditions_text` TEXT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sent_at` DATETIME NULL,
  `accepted_at` DATETIME NULL,
  `invoiced_at` DATETIME NULL,
  `is_template` TINYINT(1) DEFAULT 0,
  `service_blocks_json` JSON NULL COMMENT 'Stores structured service blocks (QuotationServiceBlock[])',
  `section_toggles_json` JSON NULL,
  `selected_points_json` JSON NULL,
  `quotation_sections_json` JSON NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_client_id` (`client_id`),
  FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: invoices
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` VARCHAR(36) NOT NULL,
  `invoice_number` VARCHAR(50) NOT NULL,
  `client_id` VARCHAR(36) NULL,
  `quotation_id` VARCHAR(36) NULL,
  `status` ENUM('draft', 'impending', 'overdue', 'paid', 'partially_paid', 'cancelled') DEFAULT 'draft',
  `type` ENUM('full', 'partial', 'milestone', 'monthly_retainer') DEFAULT 'full',
  `date_issued` DATE NULL,
  `due_date` DATE NULL,
  `currency` VARCHAR(10) DEFAULT 'INR',
  `subtotal` DECIMAL(15, 2) DEFAULT 0.00,
  `discount` DECIMAL(15, 2) DEFAULT 0.00,
  `tax_rate` DECIMAL(5, 2) DEFAULT 0.00,
  `tax_amount` DECIMAL(15, 2) DEFAULT 0.00,
  `total` DECIMAL(15, 2) DEFAULT 0.00,
  `amount_paid` DECIMAL(15, 2) DEFAULT 0.00,
  `amount_due` DECIMAL(15, 2) DEFAULT 0.00,
  `notes` TEXT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_client_id` (`client_id`),
  INDEX `idx_quotation_id` (`quotation_id`),
  FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: invoice_items
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` VARCHAR(36) NOT NULL,
  `invoice_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `quantity` DECIMAL(10, 2) DEFAULT 1,
  `unit_price` DECIMAL(15, 2) DEFAULT 0.00,
  `total` DECIMAL(15, 2) DEFAULT 0.00,
  `section` VARCHAR(100) NULL,
  `sort_order` INT DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `idx_invoice_id` (`invoice_id`),
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: receipts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `receipts` (
  `id` VARCHAR(36) NOT NULL,
  `receipt_number` VARCHAR(50) NOT NULL,
  `invoice_id` VARCHAR(36) NULL,
  `payment_date` DATE NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `currency` VARCHAR(10) DEFAULT 'INR',
  `payment_method` VARCHAR(50) NULL,
  `payment_reference` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_invoice_id` (`invoice_id`),
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: brand_kit (Single Row usually)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `brand_kit` (
  `id` VARCHAR(36) NOT NULL,
  `company_name` VARCHAR(255) NULL,
  `logo_url` TEXT NULL,
  `primary_color` VARCHAR(20) NULL,
  `secondary_color` VARCHAR(20) NULL,
  `font_heading` VARCHAR(50) NULL,
  `font_body` VARCHAR(50) NULL,
  `website` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `address` TEXT NULL,
  `default_currency` VARCHAR(10) DEFAULT 'INR',
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: quotation_point_templates
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `quotation_point_templates` (
  `id` VARCHAR(36) NOT NULL,
  `section` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NULL,
  `content` TEXT NULL,
  `sort_order` INT DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: app_settings (Key-Value Store)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `app_settings` (
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` JSON NULL,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: contracts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `contracts` (
  `id` VARCHAR(36) NOT NULL,
  `quotation_id` VARCHAR(36) NOT NULL,
  `client_id` VARCHAR(36) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'draft',
  `content_snapshot` MEDIUMTEXT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: workflow_invoices
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `workflow_invoices` (
  `id` VARCHAR(36) NOT NULL,
  `quotation_id` VARCHAR(36) NOT NULL,
  `contract_id` VARCHAR(36) NOT NULL,
  `client_id` VARCHAR(36) NOT NULL,
  `type` VARCHAR(50) NULL,
  `amount` DECIMAL(15, 2) DEFAULT 0.00,
  `status` VARCHAR(50) DEFAULT 'draft',
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: payment_receipts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment_receipts` (
  `id` VARCHAR(36) NOT NULL,
  `invoice_id` VARCHAR(36) NOT NULL,
  `client_id` VARCHAR(36) NOT NULL,
  `amount` DECIMAL(15, 2) DEFAULT 0.00,
  `payment_date` DATE NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
