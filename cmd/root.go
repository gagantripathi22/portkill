package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var (
	flagForce      bool
	flagVerbose    bool
	flagYes        bool
	flagJSON       bool
	flagInteractive bool
)

var rootCmd = &cobra.Command{
	Use:   "portkill",
	Short: "Kill processes running on specific ports",
	Long: `A cross-platform CLI tool to find and kill processes by port number.
Supports Windows, macOS, and Linux.`,
	SilenceUsage: true,
}

func init() {
	rootCmd.PersistentFlags().BoolVarP(&flagForce, "force", "f", false, "Force kill (SIGKILL on Unix, /F on Windows)")
	rootCmd.PersistentFlags().BoolVarP(&flagVerbose, "verbose", "v", false, "Verbose output")
	rootCmd.PersistentFlags().BoolVarP(&flagYes, "yes", "y", false, "Skip confirmation prompt")
	rootCmd.PersistentFlags().BoolVarP(&flagInteractive, "interactive", "i", false, "Interactive mode: select a port from a list")
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
