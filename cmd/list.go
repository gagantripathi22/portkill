package cmd

import (
	"context"
	"fmt"
	"os"

	"portkill/cmd/tui"
	"portkill/internal/finder"
	"portkill/internal/formatter"
	"portkill/internal/port"

	"github.com/charmbracelet/bubbletea"
	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(listCmd)
	listCmd.Flags().BoolVar(&flagJSON, "json", false, "Output as JSON")
}

var listCmd = &cobra.Command{
	Use:   "list [port...]",
	Short: "List processes using specific ports",
	Long: `List processes using specific ports. Use --interactive (-i) to select
a port from a list and choose an action using arrow keys.`,
	Args: cobra.MinimumNArgs(0),
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()

		var processes []finder.ProcessInfo
		var err error

		if len(args) == 0 {
			processes, err = finder.ListAllPorts(ctx)
		} else {
			ports, parseErr := port.ParsePorts(args[0])
			if parseErr != nil {
				return fmt.Errorf("invalid port: %w", parseErr)
			}
			for _, p := range ports {
				procs, findErr := finder.FindPort(ctx, p)
				if findErr != nil {
					fmt.Fprintf(os.Stderr, "Failed to find processes on port %d: %v\n", p, findErr)
					continue
				}
				processes = append(processes, procs...)
			}
		}

		if err != nil {
			return fmt.Errorf("failed to list processes: %w", err)
		}

		if len(processes) == 0 {
			fmt.Println("No processes found")
			return nil
		}

		if flagJSON {
			return formatter.PrintProcessesJSON(processes)
		}

		if flagInteractive {
			p := tea.NewProgram(tui.InitialModel(processes))
			if _, err := p.Run(); err != nil {
				return fmt.Errorf("failed to start interactive mode: %w", err)
			}
			return nil
		}

		formatter.PrintProcesses(processes, flagVerbose)
		return nil
	},
}
