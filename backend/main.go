package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"backend/internal/database"
	"backend/internal/router"

	"github.com/joho/godotenv"
)

const shutdownTimeout = 10 * time.Second

func main() {

	// .env est optionnel : en production les variables sont injectées par
	// l'environnement d'exécution (docker --env-file, Kubernetes Secret/ConfigMap...).
	if err := godotenv.Load(); err != nil {
		log.Printf("No .env file found, relying on environment variables: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	client := database.GetClient()
	fmt.Printf("Database connection established: %v\n", client != nil)

	r := router.New(client)

	addr := ":3000"
	srv := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	go func() {
		log.Printf("Server starting on %s", addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Bloque jusqu'à réception de SIGINT/SIGTERM (ex. rollout Kubernetes, docker stop).
	<-ctx.Done()
	stop()
	log.Println("Shutdown signal received, stopping server gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	database.CloseConnection()
	log.Println("Server exited")
}
