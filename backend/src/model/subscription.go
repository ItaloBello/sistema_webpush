package model

type Subscription struct {
	ID             int     `json:"id" db:"id"`
	Endpoint       string  `json:"endpoint" db:"endpoint"`
	ExpirationTime *string `json:"expirationTime" db:"expiration_time"`
	Keys           Keys    `json:"keys" db:"keys"`
}

type Keys struct {
	P256dh string `json:"p256dh" db:"p256dh"`
	Auth   string `json:"auth" db:"auth"`
}

type Payload struct {
	Title   string   `json:"title"`
	Body    string   `json:"body"`
	Image   string   `json:"image"`
	Icon    string   `json:"icon"`
	Url     string   `json:"url"`
	Actions []Action `json:"actions"`
}

type Action struct {
	Action string `json:"action"`
	Title  string `json:"title"`
}
