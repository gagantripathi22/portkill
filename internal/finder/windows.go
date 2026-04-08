package finder

import (
	"bufio"
	"context"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
)

type windowsFinder struct{}

func (f *windowsFinder) FindByPort(ctx context.Context, port int) ([]ProcessInfo, error) {
	// Run netstat to find processes on the port
	cmd := exec.CommandContext(ctx, "netstat", "-ano")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var processes []ProcessInfo
	portStr := ":" + strconv.Itoa(port)

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := scanner.Text()
		// Look for lines with the port and LISTENING state
		if strings.Contains(line, portStr) && strings.Contains(line, "LISTENING") {
			parts := strings.Fields(line)
			if len(parts) >= 5 {
				pid, err := strconv.Atoi(parts[len(parts)-1])
				if err != nil {
					continue
				}

				// Get process name via tasklist
				name, user, cmdLine, err := getProcessDetails(pid)
				if err != nil {
					name = "unknown"
					user = "unknown"
					cmdLine = ""
				}

				processes = append(processes, ProcessInfo{
					PID:  pid,
					Name: name,
					Port: port,
					User: user,
					CMD:  cmdLine,
				})
			}
		}
	}

	return processes, nil
}

func (f *windowsFinder) FindByPattern(ctx context.Context, pattern string) ([]ProcessInfo, error) {
	cmd := exec.CommandContext(ctx, "tasklist", "/FO", "LIST", "/NH")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var processes []ProcessInfo
	re := regexp.MustCompile(`(?i)` + pattern)

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := scanner.Text()
		fields := strings.Fields(line)
		if len(fields) >= 2 && re.MatchString(fields[0]) {
			pid, _ := strconv.Atoi(fields[1])
			_, user, cmdLine, _ := getProcessDetails(pid)
			processes = append(processes, ProcessInfo{
				PID:  pid,
				Name: fields[0],
				User: user,
				CMD:  cmdLine,
			})
		}
	}

	return processes, nil
}

func (f *windowsFinder) ListAll(ctx context.Context) ([]ProcessInfo, error) {
	cmd := exec.CommandContext(ctx, "netstat", "-ano")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	seen := make(map[int]bool)
	var processes []ProcessInfo

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, "LISTENING") {
			parts := strings.Fields(line)
			if len(parts) >= 5 {
				localAddr := parts[1]
				pid, err := strconv.Atoi(parts[len(parts)-1])
				if err != nil || seen[pid] {
					continue
				}
				seen[pid] = true

				// Extract port from local address
				port := 0
				if idx := strings.LastIndex(localAddr, ":"); idx >= 0 {
					port, _ = strconv.Atoi(localAddr[idx+1:])
				}

				name, user, cmdLine, _ := getProcessDetails(pid)
				processes = append(processes, ProcessInfo{
					PID:  pid,
					Name: name,
					Port: port,
					User: user,
					CMD:  cmdLine,
				})
			}
		}
	}

	return processes, nil
}

func getProcessDetails(pid int) (name, user, cmdLine string, err error) {
	// Get process name and command line from wmic
	cmd := exec.Command("wmic", "process", "where", "ProcessId="+strconv.Itoa(pid), "get", "Name,CommandLine", "/format:list")
	output, err := cmd.Output()
	if err != nil {
		return "unknown", "unknown", "", err
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "Name=") {
			name = strings.TrimPrefix(line, "Name=")
		} else if strings.HasPrefix(line, "CommandLine=") {
			cmdLine = strings.TrimPrefix(line, "CommandLine=")
		}
	}

	if name == "" {
		name = "unknown"
	}

	return name, user, cmdLine, nil
}
