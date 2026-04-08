package cmd

import (
	"context"
	"fmt"

	"portkill/internal/finder"
	"portkill/internal/formatter"
	"portkill/internal/killer"
	"portkill/internal/port"

	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(killCmd)
}

var killCmd = &cobra.Command{
	Use:   "kill <port>",
	Short: "Kill process running on a specific port",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		p, err := port.ParsePort(args[0])
		if err != nil {
			return fmt.Errorf("invalid port: %w", err)
		}

		ctx := context.Background()
		processes, err := finder.FindPort(ctx, p)
		if err != nil {
			return fmt.Errorf("failed to find processes: %w", err)
		}

		if len(processes) == 0 {
			fmt.Printf("No process found on port %d\n", p)
			return nil
		}

		formatter.PrintProcesses(processes, flagVerbose)

		if !flagYes && !formatter.Confirm(processes) {
			fmt.Println("Aborted")
			return nil
		}

		k := killer.NewKiller()
		var lastErr error
		for _, p := range processes {
			if err := k.Kill(ctx, p.PID, flagForce); err != nil {
				fmt.Fprintf(os.Stderr, "Failed to kill PID %d: %v\n", p.PID, err)
				lastErr = err
			} else {
				fmt.Printf("Killed PID %d (%s) on port %d\n", p.PID, p.Name, p.Port)
			}
		}

		return lastErr
	},
}
