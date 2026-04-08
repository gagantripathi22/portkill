package cmd

import (
	"context"
	"fmt"
	"os"

	"portkill/internal/finder"
	"portkill/internal/formatter"
	"portkill/internal/killer"
	"portkill/internal/port"

	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(killAllCmd)
}

var killAllCmd = &cobra.Command{
	Use:   "kill-all <port>...",
	Short: "Kill processes on multiple ports",
	Args:  cobra.MinimumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		ports, err := port.ParsePorts(args[0])
		if err != nil {
			return fmt.Errorf("invalid port: %w", err)
		}

		ctx := context.Background()
		var allProcesses []finder.ProcessInfo

		for _, p := range ports {
			processes, err := finder.FindPort(ctx, p)
			if err != nil {
				fmt.Fprintf(os.Stderr, "Failed to find processes on port %d: %v\n", p, err)
				continue
			}
			allProcesses = append(allProcesses, processes...)
		}

		if len(allProcesses) == 0 {
			fmt.Println("No processes found")
			return nil
		}

		formatter.PrintProcesses(allProcesses, flagVerbose)

		if !flagYes && !formatter.Confirm(allProcesses) {
			fmt.Println("Aborted")
			return nil
		}

		k := killer.NewKiller()
		var lastErr error
		for _, p := range allProcesses {
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
