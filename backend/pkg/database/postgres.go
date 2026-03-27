package database

import (
	"log"
	"os"
	"time"

	"food_delivery/config"
	"food_delivery/internal/core/domain"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewPostgresDB(cfg *config.Config) (*gorm.DB, error) {
	logLevel := logger.Info // dev default
	ignoreNotFound := false

	if cfg.App.Env == "prod" {
		logLevel = logger.Warn
		ignoreNotFound = true
	}
	gormLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             200 * time.Millisecond,
			LogLevel:                  logLevel,       // แสดงแค่ Warn ขึ้นไป ไม่รวม "record not found"
			IgnoreRecordNotFoundError: ignoreNotFound, // ซ่อน "record not found" log
			Colorful:                  true,
		},
	)

	db, err := gorm.Open(postgres.Open(cfg.Database.DSN), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		log.Printf("Failed to connect to PostgreSQL: %v", err)
		return nil, err
	}

	if err := MigratePostgresDB(db); err != nil {
		log.Printf("Failed to migrate PostgreSQL: %v", err)
		return nil, err
	}

	log.Println("Successfully connected to PostgreSQL")

	// ตั้งค่า Connection Pool
	sqlDB, err := db.DB()
	if err != nil {
		log.Printf("Failed to get sql.DB: %v", err)
		return nil, err
	}
	sqlDB.SetMaxOpenConns(cfg.Database.PoolMaxOpen)
	sqlDB.SetMaxIdleConns(cfg.Database.PoolMaxIdle)
	sqlDB.SetConnMaxLifetime(time.Duration(cfg.Database.PoolMaxLifetime) * time.Minute)
	sqlDB.SetConnMaxIdleTime(time.Duration(cfg.Database.PoolMaxIdleTime) * time.Minute)

	log.Printf("Connection pool: maxOpen=%d, maxIdle=%d, lifetime=%dm, idleTime=%dm",
		cfg.Database.PoolMaxOpen, cfg.Database.PoolMaxIdle,
		cfg.Database.PoolMaxLifetime, cfg.Database.PoolMaxIdleTime)

	return db, nil
}

func MigratePostgresDB(db *gorm.DB) error {
	// DropTableIfExists ก่อน แล้วค่อย AutoMigrate ใหม่ (ใช้เฉพาะ dev เท่านั้น!)
	// if err := db.Migrator().DropTable(&domain.Restaurant{}, &domain.MenuItem{}); err != nil {
	// 	log.Printf("Warning: failed to drop tables: %v", err)
	// }
	return db.AutoMigrate(&domain.User{}, &domain.Restaurant{}, &domain.MenuItem{}, &domain.Order{}, &domain.OderItem{}, &domain.Review{})
}
