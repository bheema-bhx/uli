package main

import (
	"log"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/pkg/errors"

	"github.com/iotexproject/uli_ocl/service/apinode"
	"github.com/iotexproject/uli_ocl/service/apinode/config"
	"github.com/iotexproject/uli_ocl/service/apinode/db"
)

func main() {
	cfg, err := config.Get()
	if err != nil {
		log.Fatal(errors.Wrap(err, "failed to get config"))
	}
	cfg.Print()
	slog.Info("apinode config loaded")

	db, err := db.New(cfg.LocalDBDir, cfg.DatabaseDSN)
	if err != nil {
		log.Fatal(err)
	}

	apinode := apinode.NewAPINode(cfg, db)

	if err := apinode.Start(); err != nil {
		log.Fatal(err)
	}
	defer apinode.Stop()

	done := make(chan os.Signal, 1)
	signal.Notify(done, syscall.SIGINT, syscall.SIGTERM)
	<-done
}
