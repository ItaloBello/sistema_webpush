CREATE TABLE subscriptions(
    id SERIAL PRIMARY KEY,
    endpoint TEXT NOT NULL,
    expiration_time TIMESTAMP,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL
);

SELECT * FROM subscriptions;