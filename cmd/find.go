package cmd

import (
	"context"
	"fmt"

	"portkill/internal/finder"
	"portkill/internal/formatter"

	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(findCmd)
	findCmd.Flags().BoolVar(&flagJSON, "json", false, "Output as JSON")
}

var findCmd = &cobra.Command{
	Use:   "find <process-name>",
	Short: "Find processes by name pattern",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		pattern := args[0]

		processes, err := finder.FindPattern(ctx, pattern)
		if err != nil {
			return fmt.Errorf("failed to find processes: %w", err)
		}

		if len(processes) == 0 {
			fmt.Printf("No processes found matching '%s'\n", pattern)
			return nil
		}

		if flagJSON {
			return formatter.PrintProcessesJSON(processes)
		}
		formatter.PrintProcesses(processes, flagVerbose)
		return nil
	},
}
