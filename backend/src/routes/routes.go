package routes

import (

	"sistema_webpush/src/handler/subscription_handler"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine, h *subscription_handler.SubscriptionHandler) {
	r.POST("/api/save-subscription", h.SaveSubscription)
	r.POST("/api/send-test", h.SendTest)
	r.POST("/api/send-notification", h.SendNotification)
}
