package subscription_handler

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"sistema_webpush/src/model"
	"sistema_webpush/src/service/subscription_service"

	"github.com/gin-gonic/gin"
)

type SubscriptionHandler struct {
	service *subscription_service.SubscriptionService
}

func NewSubscriptionHandler(service *subscription_service.SubscriptionService) *SubscriptionHandler {
	return &SubscriptionHandler{service: service}
}

func (h *SubscriptionHandler) SaveSubscription(c *gin.Context) {
	var subscription model.Subscription
	if err := c.ShouldBindJSON(&subscription); err != nil {
		fmt.Println("Erro ao bind json:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao bind json"})
		return
	}

	if err := h.service.SaveSubscription(&subscription); err != nil {
		fmt.Println("Erro ao salvar subscription:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar subscription"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Subscription saved successfully", "subscription": subscription})
}

func (h *SubscriptionHandler) SendTest(c *gin.Context) {
	var request struct {
		Subscription model.Subscription `json:"subscription"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		fmt.Println("Erro ao bind json:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao bind json"})
		return
	}

	if err := h.service.SendTest(&request.Subscription); err != nil {
		fmt.Println("Erro ao enviar test:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao enviar test"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Test message sent successfully"})
}

func (h *SubscriptionHandler) SendNotification(c *gin.Context) {
	// Lê o corpo bruto
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		fmt.Println("Erro ao ler body:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao ler body"})
		return
	}

	// Loga o payload recebido (como string)
	fmt.Println("Payload recebido:")
	fmt.Println(string(bodyBytes))

	// Reatribui o body para que o ShouldBindJSON ainda funcione
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var request struct {
		Subscription model.Subscription `json:"subscription"`
		Payload      model.Payload      `json:"payload"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		fmt.Println("Erro ao bind json:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao bind json"})
		return
	}

	if err := h.service.SendNotification(&request.Subscription, &request.Payload); err != nil {
		fmt.Println("Erro ao enviar notificação:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao enviar notificação"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification sent successfully"})
}
