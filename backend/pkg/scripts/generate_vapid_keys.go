// cmd/generate_vapid/main.go
package main

import (
	"fmt"
	"log"

	"github.com/SherClockHolmes/webpush-go"
)

func main() {
	privateKey, publicKey, err := webpush.GenerateVAPIDKeys()
	if err != nil {
		log.Fatal("Erro ao gerar chaves:", err)
	}

	fmt.Println("=== CHAVES VAPID GERADAS ===")
	fmt.Println("\nChave Pública (use no frontend):")
	fmt.Println(publicKey)
	fmt.Println("\nChave Privada (guarde em segurança):")
	fmt.Println(privateKey)
	fmt.Println("\n=== PARA USAR NO SEU PROJETO ===")
	fmt.Printf("vapidPublicKey := \"%s\"\n", publicKey)
	fmt.Printf("vapidPrivateKey := \"%s\"\n", privateKey)

	// Validar tamanhos
	fmt.Println("\n=== VALIDAÇÃO ===")
	fmt.Printf("Tamanho chave pública: %d bytes\n", len(publicKey))
	fmt.Printf("Tamanho chave privada: %d bytes\n", len(privateKey))
}
