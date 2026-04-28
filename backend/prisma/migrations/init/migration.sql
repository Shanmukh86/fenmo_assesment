-- CreateTable
CREATE TABLE `expenses` (
    `id` CHAR(36) NOT NULL,
    `amount` DECIMAL(19,2) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `date` DATE NOT NULL,
    `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `idempotency_key` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `expenses_idempotency_key_key` ON `expenses`(`idempotency_key`);

-- CreateIndex
CREATE INDEX `expenses_category_idx` ON `expenses`(`category`);

-- CreateIndex
CREATE INDEX `expenses_date_idx` ON `expenses`(`date`);
