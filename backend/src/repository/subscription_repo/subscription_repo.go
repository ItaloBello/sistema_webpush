package subscription_repo

import (
	"sistema_webpush/src/model"

	"github.com/jmoiron/sqlx"
)

type SubscriptionRepo struct {
	db *sqlx.DB
}

func NewSubscriptionRepo(db *sqlx.DB) *SubscriptionRepo {
	return &SubscriptionRepo{db: db}
}

func (r *SubscriptionRepo) SaveSubscription(subscription *model.Subscription) error {
	const query = `INSERT INTO subscriptions (endpoint, expiration_time, p256dh, auth) VALUES (:endpoint, :expiration_time, :keys.p256dh, :keys.auth) RETURNING id`
	rows, err := r.db.NamedQuery(query, subscription)
	if err != nil {
		return err
	}
	defer rows.Close()
	if rows.Next() {
		return rows.Scan(&subscription.ID)
	}
	return nil
}
