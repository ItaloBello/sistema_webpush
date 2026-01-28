package subscription_service

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"sistema_webpush/src/model"
	"sistema_webpush/src/repository/subscription_repo"

	"github.com/SherClockHolmes/webpush-go"
)

type SubscriptionService struct {
	repo *subscription_repo.SubscriptionRepo
}

func NewSubscriptionService(repo *subscription_repo.SubscriptionRepo) *SubscriptionService {
	return &SubscriptionService{repo: repo}
}

func (s *SubscriptionService) SaveSubscription(subscription *model.Subscription) error {
	return s.repo.SaveSubscription(subscription)
}

func (s *SubscriptionService) SendTest(subscription *model.Subscription) error {
	sub := &webpush.Subscription{
		Endpoint: subscription.Endpoint,
		Keys: webpush.Keys{
			Auth:   subscription.Keys.Auth,
			P256dh: subscription.Keys.P256dh,
		},
	}
	opt := &webpush.Options{
		Subscriber:      "example@example.com",
		VAPIDPublicKey:  os.Getenv("VAPID_PUBLIC_KEY"),
		VAPIDPrivateKey: os.Getenv("VAPID_PRIVATE_KEY"),
		TTL:             30,
	}
	resp, err := webpush.SendNotification([]byte(`{"title":"Teste","body":"Esta é uma notificação de teste!"}`), sub, opt)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Push response status: %d, body: %s\n", resp.StatusCode, string(body))
	if resp.StatusCode >= 400 {
		return fmt.Errorf("push failed with status %d: %s", resp.StatusCode, string(body))
	}
	return nil
}

func (s *SubscriptionService) SendNotification(subscription *model.Subscription, payload *model.Payload) error {
	sub := &webpush.Subscription{
		Endpoint: subscription.Endpoint,
		Keys: webpush.Keys{
			Auth:   subscription.Keys.Auth,
			P256dh: subscription.Keys.P256dh,
		},
	}
	opt := &webpush.Options{
		Subscriber:      "example@example.com",
		VAPIDPublicKey:  os.Getenv("VAPID_PUBLIC_KEY"),
		VAPIDPrivateKey: os.Getenv("VAPID_PRIVATE_KEY"),
		TTL:             30,
	}
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	resp, err := webpush.SendNotification(jsonData, sub, opt)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Push response status: %d, body: %s\n", resp.StatusCode, string(body))
	if resp.StatusCode >= 400 {
		return fmt.Errorf("push failed with status %d: %s", resp.StatusCode, string(body))
	}
	return nil	
}