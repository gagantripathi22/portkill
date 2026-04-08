package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var version = "1.0.0"

func init() {
	rootCmd.AddCommand(versionCmd)
}

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the version number of portkill",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("portkill version %s\n", version)
	},
}
