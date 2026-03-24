package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	App          AppConfig
	Database     DatabaseConfig
	JWT          JWTConfig
	RefreshToken RefreshTokenConfig
}

// AppConfig holds application-level configuration
type AppConfig struct {
	Env  string
	Port string
}

// DatabaseConfig holds database connection configuration
type DatabaseConfig struct {
	Host            string
	Port            string
	User            string
	Password        string
	Name            string
	DSN             string
	PoolMaxOpen     int // จำนวน connection สูงสุดที่เปิดได้
	PoolMaxIdle     int // จำนวน connection ที่ idle ได้
	PoolMaxLifetime int // อายุสูงสุดของ connection (นาที)
	PoolMaxIdleTime int // อายุสูงสุดของ idle connection (นาที)
}

// JWTConfig holds JWT configuration
type JWTConfig struct {
	Secret      string
	ExpireHours int
}

type RefreshTokenConfig struct {
	Secret        string
	ExpireMinutes int
}

// Load reads configuration from environment variables (with .env fallback)
func Load() (*Config, error) {
	if err := godotenv.Load(); err != nil {
		fmt.Println("Warning: .env file not found, using environment variables")
	}

	expireHours, err := strconv.Atoi(os.Getenv("JWT_EXPIRE_HOURS"))
	if err != nil {
		expireHours = 24
	}

	refreshExpireMinutes, err := strconv.Atoi(os.Getenv("JWT_REFRESH_EXPIRE_MINUTES"))
	if err != nil {
		refreshExpireMinutes = 5
	}

	poolMaxOpen, err := strconv.Atoi(os.Getenv("DB_POOL_MAX_OPEN"))
	if err != nil {
		poolMaxOpen = 25
	}

	poolMaxIdle, err := strconv.Atoi(os.Getenv("DB_POOL_MAX_IDLE"))
	if err != nil {
		poolMaxIdle = 10
	}

	poolMaxLifetime, err := strconv.Atoi(os.Getenv("DB_POOL_MAX_LIFETIME"))
	if err != nil {
		poolMaxLifetime = 60
	}

	poolMaxIdleTime, err := strconv.Atoi(os.Getenv("DB_POOL_MAX_IDLE_TIME"))
	if err != nil {
		poolMaxIdleTime = 10
	}

	cfg := &Config{
		App: AppConfig{
			Env:  os.Getenv("APP_ENV"),
			Port: os.Getenv("APP_PORT"),
		},
		Database: DatabaseConfig{
			Host:            os.Getenv("DB_HOST"),
			Port:            os.Getenv("DB_PORT"),
			User:            os.Getenv("DB_USER"),
			Password:        os.Getenv("DB_PASSWORD"),
			Name:            os.Getenv("DB_NAME"),
			PoolMaxOpen:     poolMaxOpen,
			PoolMaxIdle:     poolMaxIdle,
			PoolMaxLifetime: poolMaxLifetime,
			PoolMaxIdleTime: poolMaxIdleTime,
		},
		JWT: JWTConfig{
			Secret:      os.Getenv("JWT_SECRET"),
			ExpireHours: expireHours,
		},
		RefreshToken: RefreshTokenConfig{
			Secret:        os.Getenv("JWT_REFRESH_SECRET"),
			ExpireMinutes: refreshExpireMinutes,
		},
	}

	cfg.Database.DSN = fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Bangkok",
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Name,
	)

	return cfg, nil
}
