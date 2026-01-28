package main

import (
	"fmt"
	"os"
	"sistema_webpush/pkg/database"
	"sistema_webpush/src/handler/subscription_handler"
	"sistema_webpush/src/repository/subscription_repo"
	"sistema_webpush/src/routes"
	"sistema_webpush/src/service/subscription_service"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func middlewareCORS(c *gin.Context) {
	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
	c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if c.Request.Method == "OPTIONS" {
		c.AbortWithStatus(204)
		return
	}

	c.Next()
}

func main() {
	err := godotenv.Load()
	if err != nil {
		panic("Error loading .env file")
	}
	conn, err := database.ConnectDB()
	if err != nil {
		panic("Error connecting to database")
	}

	vapidPublicKey := os.Getenv("VAPID_PUBLIC_KEY")
	vapidPrivateKey := os.Getenv("VAPID_PRIVATE_KEY")
	if vapidPublicKey == "" || vapidPrivateKey == "" {
		panic("VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not found in .env file")
	}

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()
	r.Static("/frontend", "../frontend")
	r.Use(middlewareCORS)

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Hello World",
		})
	})

	routes.SetupRoutes(r, subscription_handler.NewSubscriptionHandler(subscription_service.NewSubscriptionService(subscription_repo.NewSubscriptionRepo(conn))))
	fmt.Println("Server running on port 8080")
	r.Run(":8080")
}
