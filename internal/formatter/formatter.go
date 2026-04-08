package formatter

import (
	"encoding/json"
	"fmt"
	"os"
	"text/tabwriter"

	"portkill/internal/finder"
)

// PrintProcesses prints process info in a formatted table or JSON
func PrintProcesses(processes []finder.ProcessInfo, verbose bool) {
	if len(processes) == 0 {
		fmt.Println("No processes found")
		return
	}

	w := tabwriter.NewWriter(os.Stdout, 0, 8, 2, ' ', 0)
	defer w.Flush()

	// Print header
	if verbose {
		fmt.Fprintf(w, "PID\tPORT\tUSER\tNAME\tCMD\n")
	} else {
		fmt.Fprintf(w, "PID\tPORT\tNAME\n")
	}

	// Print each process
	for _, p := range processes {
		if verbose {
			fmt.Fprintf(w, "%d\t%d\t%s\t%s\t%s\n", p.PID, p.Port, p.User, p.Name, p.CMD)
		} else {
			fmt.Fprintf(w, "%d\t%d\t%s\n", p.PID, p.Port, p.Name)
		}
	}
}

// PrintProcessesJSON prints process info as JSON
func PrintProcessesJSON(processes []finder.ProcessInfo) error {
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	return encoder.Encode(processes)
}

// Confirm prints a confirmation prompt and returns true if user confirms
func Confirm(processes []finder.ProcessInfo) bool {
	fmt.Printf("Kill %d process(es)? (y/N): ", len(processes))
	var answer string
	fmt.Scanln(&answer)
	return answer == "y" || answer == "Y"
}
