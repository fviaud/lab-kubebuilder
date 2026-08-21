package main

import (
	"fmt"
	"log"

	"backend/internal/database"
	"backend/internal/router"

	"github.com/joho/godotenv"
)

func main() {

	// .env est optionnel : en production les variables sont injectées par
	// l'environnement d'exécution (docker --env-file, Kubernetes Secret/ConfigMap...).
	if err := godotenv.Load(); err != nil {
		log.Printf("No .env file found, relying on environment variables: %v", err)
	}

	client := database.GetClient()
	defer database.CloseConnection()
	fmt.Printf("Database connection established: %v\n", client != nil)

	r := router.New(client)

	addr := ":3000"
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}
